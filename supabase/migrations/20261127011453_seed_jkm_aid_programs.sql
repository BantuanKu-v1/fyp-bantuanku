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
        'ba',
        'Bantuan Am (BA)',
        'Jabatan Kebajikan Masyarakat',
        'welfare_assistance',
        'Financial assistance for individuals and families requiring welfare support.',
        'external_api',
        true
    ),
    (
        'bat',
        'Bantuan Alat Tiruan / Alat Sokongan (BAT)',
        'Jabatan Kebajikan Masyarakat',
        'welfare_assistance',
        'Assistance for eligible individuals requiring prosthetic devices or assistive equipment.',
        'external_api',
        true
    ),
    (
        'bpt',
        'Bantuan Penjagaan (BPT)',
        'Jabatan Kebajikan Masyarakat',
        'welfare_assistance',
        'Assistance for eligible patients and caregivers requiring ongoing care and support.',
        'external_api',
        true
    ),
    (
        'bwe',
        'Bantuan Warga Emas (BWE)',
        'Jabatan Kebajikan Masyarakat',
        'welfare_assistance',
        'Financial assistance for eligible elderly individuals.',
        'external_api',
        true
    )
    on conflict (code) do nothing;
