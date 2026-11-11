CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT private.has_role(_user_id, 'platform_administrator');
$$;

CREATE OR REPLACE FUNCTION private.has_hospital_role(_user_id uuid, _hospital_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hospital_users hu
    WHERE hu.user_id = _user_id AND hu.hospital_id = _hospital_id
      AND hu.status = 'active' AND hu.role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION private.owns_patient(_user_id uuid, _patient_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT EXISTS (SELECT 1 FROM public.patients p WHERE p.id = _patient_id AND p.user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION private.hospital_can_access_patient(_user_id uuid, _patient_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hospital_users hu
    WHERE hu.user_id = _user_id AND hu.status = 'active' AND hu.role = ANY(_roles)
      AND (
        EXISTS (SELECT 1 FROM public.patients p WHERE p.id = _patient_id AND p.current_hospital_id = hu.hospital_id)
        OR EXISTS (SELECT 1 FROM public.patient_hospital_history phh WHERE phh.patient_id = _patient_id AND phh.hospital_id = hu.hospital_id)
        OR EXISTS (SELECT 1 FROM public.applications a WHERE a.patient_id = _patient_id AND a.hospital_id = hu.hospital_id)
        OR EXISTS (SELECT 1 FROM public.transfers t WHERE t.patient_id = _patient_id AND (t.originating_hospital_id = hu.hospital_id OR t.receiving_hospital_id = hu.hospital_id))
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.guard_profile_security_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.is_admin(auth.uid()) THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Profile ownership and account status are backend-controlled';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_patient_identity_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.is_admin(auth.uid()) THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.reference_code IS DISTINCT FROM OLD.reference_code THEN
      RAISE EXCEPTION 'Patient identity fields are backend-controlled';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.is_admin(uuid), private.has_hospital_role(uuid, uuid, public.app_role[]), private.owns_patient(uuid, uuid), private.hospital_can_access_patient(uuid, uuid, public.app_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid), private.has_hospital_role(uuid, uuid, public.app_role[]), private.owns_patient(uuid, uuid), private.hospital_can_access_patient(uuid, uuid, public.app_role[]) TO authenticated, service_role;