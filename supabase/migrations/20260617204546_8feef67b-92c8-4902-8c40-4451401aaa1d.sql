
REVOKE EXECUTE ON FUNCTION public.is_room_member(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_room_host(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_room_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_room_host(UUID) TO authenticated;
