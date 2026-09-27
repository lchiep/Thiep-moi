-- ============================================================
-- Thiệp mời Graduation Gala 2026 — Supabase schema
-- Đã áp dụng lên project "thiep-moi-graduation-gala" (jbnemrbfdxngqzlrsyve)
--
-- Nguyên tắc bảo mật:
--   - Khách (anon) CHỈ được GHI qua hàm register_guest / submit_rsvp / submit_wish.
--   - Khách KHÔNG đọc được bảng nào (SĐT, CCCD, ảnh của người khác được bảo vệ).
--   - Hiệp xem dữ liệu trong Supabase Dashboard → Table Editor (quyền admin).
-- ============================================================

create sequence if not exists public.ticket_seq start 1;

create table if not exists public.guests (
  id           uuid primary key,                       -- client tự tạo (crypto.randomUUID) để dùng làm tên thư mục ảnh
  ticket_no    text not null unique,                   -- GH26-0001, GH26-0002...
  full_name    text not null check (char_length(full_name) between 1 and 120),
  nickname     text check (char_length(nickname) <= 60),
  phone        text check (char_length(phone) <= 20),
  cccd         text check (char_length(cccd) <= 20),
  gender       text not null check (gender in ('nam','nu')),
  email        text check (char_length(email) <= 160),
  dob          date,
  hobbies      text check (char_length(hobbies) <= 300),
  description  text check (char_length(description) <= 1000),
  photo_path   text,                                   -- đường dẫn trong bucket guest-photos
  created_at   timestamptz not null default now()
);

create table if not exists public.rsvps (
  id          bigint generated always as identity primary key,
  guest_id    uuid not null references public.guests(id) on delete cascade,
  status      text not null check (status in ('attending','not_attending','maybe')),
  created_at  timestamptz not null default now()
);

create table if not exists public.wishes (
  id          bigint generated always as identity primary key,
  guest_id    uuid references public.guests(id) on delete cascade,
  message     text not null check (char_length(message) between 1 and 1000),
  created_at  timestamptz not null default now()
);

create index if not exists rsvps_guest_idx  on public.rsvps(guest_id, created_at desc);
create index if not exists wishes_guest_idx on public.wishes(guest_id);

-- Bật RLS, KHÔNG tạo policy nào cho anon → anon không select/insert/update/delete trực tiếp được.
alter table public.guests enable row level security;
alter table public.rsvps  enable row level security;
alter table public.wishes enable row level security;

-- ---------- Hàm ghi dữ liệu (chạy với quyền owner, anon chỉ được gọi hàm) ----------

create or replace function public.register_guest(
  p_id uuid, p_full_name text, p_nickname text, p_phone text, p_cccd text,
  p_gender text, p_email text, p_dob date, p_hobbies text, p_description text,
  p_photo_path text
) returns text
language plpgsql security definer set search_path = public as $$
declare v_ticket text;
begin
  -- Đăng ký lại cùng id (khách bấm gửi 2 lần) → trả về mã vé cũ, không tạo vé mới
  select ticket_no into v_ticket from guests where id = p_id;
  if v_ticket is not null then return v_ticket; end if;

  v_ticket := 'GH26-' || lpad(nextval('ticket_seq')::text, 4, '0');
  insert into guests (id, ticket_no, full_name, nickname, phone, cccd, gender,
                      email, dob, hobbies, description, photo_path)
  values (p_id, v_ticket, trim(p_full_name), nullif(trim(p_nickname),''), p_phone, p_cccd,
          p_gender, p_email, p_dob, p_hobbies, p_description, p_photo_path);
  return v_ticket;
end $$;

create or replace function public.submit_rsvp(p_guest_id uuid, p_status text)
returns void language sql security definer set search_path = public as $$
  insert into rsvps (guest_id, status) values (p_guest_id, p_status);
$$;

create or replace function public.submit_wish(p_guest_id uuid, p_message text)
returns void language sql security definer set search_path = public as $$
  insert into wishes (guest_id, message) values (p_guest_id, trim(p_message));
$$;

revoke all on function public.register_guest(uuid,text,text,text,text,text,text,date,text,text,text) from public;
revoke all on function public.submit_rsvp(uuid,text) from public;
revoke all on function public.submit_wish(uuid,text) from public;
grant execute on function public.register_guest(uuid,text,text,text,text,text,text,date,text,text,text) to anon, authenticated;
grant execute on function public.submit_rsvp(uuid,text) to anon, authenticated;
grant execute on function public.submit_wish(uuid,text) to anon, authenticated;

-- ---------- View cho Hiệp xem nhanh (chỉ admin, anon không đọc được) ----------
create or replace view public.guest_overview with (security_invoker = on) as
select g.ticket_no, g.full_name, g.nickname, g.gender, g.phone, g.email, g.created_at,
       (select r.status from rsvps r where r.guest_id = g.id order by r.created_at desc limit 1) as rsvp,
       (select count(*) from wishes w where w.guest_id = g.id) as wish_count
from guests g
order by g.created_at desc;
revoke all on public.guest_overview from anon, authenticated;

-- ---------- Storage: ảnh khách ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guest-photos', 'guest-photos', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- anon chỉ được UPLOAD vào guest-photos/<uuid>/..., không xem/xoá/ghi đè ảnh người khác
drop policy if exists "guest photo upload" on storage.objects;
create policy "guest photo upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'guest-photos'
              and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$');
