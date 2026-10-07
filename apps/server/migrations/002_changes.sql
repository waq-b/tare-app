-- P1: the app syncs the rules' changes (applied, offered, accepted, kept) as a new table.
alter table public.records drop constraint if exists records_tbl_check;
alter table public.records add constraint records_tbl_check
  check (tbl in ('profile', 'screening', 'plans', 'workouts', 'sets', 'weighIns', 'painFlags', 'changes'));
