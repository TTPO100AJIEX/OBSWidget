/* Insert with winning is not allowed */
CREATE FUNCTION bonuses_insert_check() RETURNS TRIGGER
LANGUAGE plpgsql VOLATILE LEAKPROOF STRICT PARALLEL SAFE
AS $$
BEGIN
	IF (NEW.winning IS NOT NULL) THEN
		RAISE EXCEPTION SQLSTATE '23514' USING
			MESSAGE = 'Winning default value constraint violation',
			DETAIL = 'Winning must initially be NULL',
			HINT = 'Please, fix your request';
	END IF;
	RETURN NEW;
END $$;

CREATE CONSTRAINT TRIGGER bonuses_insert_trigger AFTER INSERT ON bonuses
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION bonuses_insert_check();



/* Setting winning is allowed only for active bonuses */
CREATE FUNCTION bonuses_update_check() RETURNS TRIGGER
LANGUAGE plpgsql VOLATILE LEAKPROOF STRICT PARALLEL SAFE
AS $$
BEGIN
	IF (OLD.winning IS NOT NULL) AND (NEW.winning IS NULL) THEN
		RAISE EXCEPTION SQLSTATE '23000' USING
			MESSAGE = 'Winning update check constraint violation',
			DETAIL = 'Unsetting winning is not allowed',
			HINT = 'Please, fix your request';
	END IF;
	IF (OLD.winning IS NULL) AND (NEW.winning IS NOT NULL) AND NOT (SELECT is_active FROM bonuses_view WHERE id = NEW.id) THEN
		RAISE EXCEPTION SQLSTATE '23000' USING
			MESSAGE = 'Winning update check constraint violation',
			DETAIL = 'Setting winning of bonuses that are not active is not allowed',
			HINT = 'Please, fix your request';
	END IF;
	RETURN NEW;
END $$;

CREATE TRIGGER bonuses_update_trigger BEFORE UPDATE ON bonuses
FOR EACH ROW EXECUTE FUNCTION bonuses_update_check();



/* Deleting active bonuses is not allowed */
CREATE FUNCTION bonuses_delete_check() RETURNS TRIGGER
LANGUAGE plpgsql VOLATILE LEAKPROOF STRICT PARALLEL SAFE
AS $$
BEGIN
	IF (SELECT is_active FROM bonuses_view WHERE id = OLD.id) AND (SELECT mode FROM sessions_view WHERE id = OLD.session_id) = 'START' THEN
		RAISE EXCEPTION SQLSTATE '23000' USING
			MESSAGE = 'Bonuses delete constraint violation',
			DETAIL = 'Deleteing active bonuses is not allowed',
			HINT = 'Please, fix your request';
	END IF;
	RETURN OLD;
END $$;

CREATE TRIGGER bonuses_delete_trigger BEFORE DELETE ON bonuses
FOR EACH ROW EXECUTE FUNCTION bonuses_delete_check();