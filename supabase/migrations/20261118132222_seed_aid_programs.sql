insert into public.aid_programs (
    code,
    name,
    agency,
    category,
    description,
    application_method,
    is_active
)
values
    (
        'str',
        'Sumbangan Tunai Rahmah (STR)',
        'Lembaga Hasil Dalam Negeri Malaysia (LHDNM)',
        'financial_assistance',
        'Government financial assistance for eligible individuals and households.',
        'external_api',
        true
    ),
    (
        'jkm',
        'Jabatan Kebajikan Masyarakat (JKM)',
        'Jabatan Kebajikan Masyarakat',
        'welfare_assistance',
        'Welfare assistance programmes administered by the Department of Social Welfare.',
        'external_api',
        true
    )
    on conflict (code)
do update set
    name = excluded.name,
    agency = excluded.agency,
    category = excluded.category,
    description = excluded.description,
    application_method = excluded.application_method,
    is_active = excluded.is_active;
