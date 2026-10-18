-- Kho thống kê truy cập laquoc.com — Supabase dự án `laquoc-com` (mzqngrbbmlsuzlvrbzjl, ap-southeast-1).
-- Bản ghi lại cấu trúc đã áp ngày 2026-10-18. Đếm ẩn danh: không IP, không tên, không email.

create table public.su_kien (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  loai text not null check (loai in ('xem','roi')),          -- xem: mở trang · roi: rời trang (kèm % đọc, giây)
  may text not null check (char_length(may) <= 60),          -- tên miền: laquoc.com hoặc localhost
  duong text not null check (char_length(duong) <= 120),     -- trang: trang-chu, bai-<id>, lab-<id>…
  nguoi text not null check (char_length(nguoi) between 8 and 40),  -- mã ngẫu nhiên theo trình duyệt
  phien text not null check (char_length(phien) between 8 and 40),
  nguon text check (char_length(nguon) <= 120),              -- tên miền nguồn (facebook.com…), null = trực tiếp
  thiet_bi text check (thiet_bi in ('dien-thoai','may-tinh-bang','may-tinh')),
  phan_tram smallint check (phan_tram between 0 and 100),
  giay integer check (giay between 0 and 21600)
);
create index su_kien_ts on public.su_kien (ts);
create index su_kien_duong on public.su_kien (duong, ts);
alter table public.su_kien enable row level security;
create policy "ghi an danh" on public.su_kien for insert to anon, authenticated
  with check (ts > now() - interval '5 minutes' and ts < now() + interval '5 minutes');
grant insert on public.su_kien to anon, authenticated;
revoke select, update, delete on public.su_kien from anon, authenticated;

create table public.quan_tri (email text primary key);      -- ai được xem báo cáo
alter table public.quan_tri enable row level security;
revoke all on public.quan_tri from anon, authenticated;
insert into public.quan_tri values ('quocla@blockchain.vn');

CREATE OR REPLACE FUNCTION public.la_quan_tri()
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.quan_tri q
    join auth.users u on lower(u.email) = q.email
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$function$;

-- bao_cao(p_ngay, p_may): xem định nghĩa đầy đủ trong Supabase (pg_get_functiondef).
-- Trả về jsonb: tong · theo_ngay · trang · nguon · thiet_bi. Báo lỗi nếu không phải quản trị.
revoke execute on function public.la_quan_tri() from public, anon;
grant execute on function public.la_quan_tri() to authenticated;
