# BantuanKu Database Design

> **Last Updated:** 4 October 2026

## Overview
BantuanKu uses **Supabase PostgreSQL** for persistent structured data and **Supabase Storage** for supporting documents.

The database is designed around reusable beneficiary information, program-specific information, user features, documents
and simulated applications.

A Supabase Auth user is linked to a beneficiary through `profiles.user_id`. User-owned beneficiary data is then associated
with the beneficiary through `profile_id` where applicable.

```text
auth.users
    │
    └── profiles
            │
            ├── addresses
            ├── household_members
            ├── financial_profiles
            ├── health_profiles
            ├── caregivers
            ├── documents
            └── applications
```

Eligibility rules, derived eligibility facts and fictional mock government records are not stored in the database. 
These are handled by the TypeScript eligibility and mock verification services.

---

## Tables

### `profiles`
| Field                | Type        | Description                              |
|----------------------|-------------|------------------------------------------|
| `id`                 | UUID        | Primary key                              |
| `user_id`            | UUID        | References `auth.users.id`               |
| `full_name`          | TEXT        | Beneficiary's full name                  |
| `identification_no`  | TEXT        | Identification number used by the system |
| `date_of_birth`      | DATE        | Used to derive age                       |
| `gender`             | TEXT        | Gender, where available                  |
| `citizenship`        | TEXT        | Citizenship                              |
| `marital_status`     | TEXT        | Marital status                           |
| `occupation`         | TEXT        | Occupation, where applicable             |
| `employment_status`  | TEXT        | Employment status                        |
| `mobile_phone`       | TEXT        | Mobile phone number                      |
| `home_phone`         | TEXT        | Home phone number, where applicable      |
| `email`              | TEXT        | Email address, where applicable          |
| `preferred_language` | TEXT        | BM, English or Mandarin                  |
| `created_at`         | TIMESTAMPTZ | Record creation time                     |
| `updated_at`         | TIMESTAMPTZ | Last update time                         |

Age is derived from `date_of_birth` and is not stored separately.

`profiles.user_id` provides the link between the Supabase Authentication account and the BantuanKu beneficiary profile.

Some profile fields may be completed or updated through Profile Management rather than during initial registration.

---

### `addresses`
| Field             | Type        |
|-------------------|-------------|
| `id`              | UUID        |
| `profile_id`      | UUID        |
| `address_type`    | TEXT        |
| `address_line_1`  | TEXT        |
| `address_line_2`  | TEXT        |
| `postcode`        | TEXT        |
| `city`            | TEXT        |
| `state_territory` | TEXT        |
| `country_code`    | TEXT        |
| `is_primary`      | BOOLEAN     |
| `created_at`      | TIMESTAMPTZ |
| `updated_at`      | TIMESTAMPTZ |

`profile_id` references `profiles.id`.

The current implementation stores `country_code` as `MY`.

Federal Territory and Malaysian residence information can be derived from the stored address information.

---

### `household_members`
| Field               | Type        |
|---------------------|-------------|
| `id`                | UUID        |
| `profile_id`        | UUID        |
| `full_name`         | TEXT        |
| `identification_no` | TEXT        |
| `relationship`      | TEXT        |
| `date_of_birth`     | DATE        |
| `gender`            | TEXT        |
| `citizenship`       | TEXT        |
| `is_dependent`      | BOOLEAN     |
| `employment_status` | TEXT        |
| `occupation`        | TEXT        |
| `monthly_income`    | DECIMAL     |
| `is_student`        | BOOLEAN     |
| `study_mode`        | TEXT        |
| `institution_type`  | TEXT        |
| `is_oku`            | BOOLEAN     |
| `oku_registered`    | BOOLEAN     |
| `created_at`        | TIMESTAMPTZ |
| `updated_at`        | TIMESTAMPTZ |

`profile_id` references `profiles.id`.

Household size, number of dependants, child status and other household facts can be derived from these records.

---

### `financial_profiles`
| Field                      | Type        |
|----------------------------|-------------|
| `id`                       | UUID        |
| `profile_id`               | UUID        |
| `monthly_personal_income`  | DECIMAL     |
| `monthly_household_income` | DECIMAL     |
| `income_source`            | TEXT        |
| `created_at`               | TIMESTAMPTZ |
| `updated_at`               | TIMESTAMPTZ |

`profile_id` references `profiles.id`.

Per-capita household income is calculated by the eligibility engine and is not stored.

---

### `welfare_assistance`
| Field             | Type        |
|-------------------|-------------|
| `id`              | UUID        |
| `user_id`         | UUID        |
| `program_name`    | TEXT        |
| `agency`          | TEXT        |
| `assistance_type` | TEXT        |
| `monthly_amount`  | DECIMAL     |
| `is_active`       | BOOLEAN     |
| `start_date`      | DATE        |
| `end_date`        | DATE        |
| `created_at`      | TIMESTAMPTZ |
| `updated_at`      | TIMESTAMPTZ |

This table records welfare assistance information where required by BantuanKu's eligibility and profile features.

---

### `health_profiles`
| Field                           | Type        |
|---------------------------------|-------------|
| `id`                            | UUID        |
| `profile_id`                    | UUID        |
| `is_oku`                        | BOOLEAN     |
| `oku_registered`                | BOOLEAN     |
| `disability_description`        | TEXT        |
| `has_chronic_illness`           | BOOLEAN     |
| `chronic_illness_details`       | TEXT        |
| `is_bedridden`                  | BOOLEAN     |
| `requires_continuous_treatment` | BOOLEAN     |
| `treatment_start_date`          | DATE        |
| `created_at`                    | TIMESTAMPTZ |
| `updated_at`                    | TIMESTAMPTZ |

`profile_id` references `profiles.id`.

Continuous-treatment duration can be derived from `treatment_start_date`.

---

### `caregivers`
| Field                        | Type        |
|------------------------------|-------------|
| `id`                         | UUID        |
| `profile_id`                 | UUID        |
| `full_name`                  | TEXT        |
| `identification_no`          | TEXT        |
| `citizenship`                | TEXT        |
| `relationship`               | TEXT        |
| `provides_intensive_care`    | BOOLEAN     |
| `eligible_persons_cared_for` | INTEGER     |
| `created_at`                 | TIMESTAMPTZ |
| `updated_at`                 | TIMESTAMPTZ |

`profile_id` references `profiles.id`.

---

### `living_arrangements`
| Field                    | Type        |
|--------------------------|-------------|
| `id`                     | UUID        |
| `user_id`                | UUID        |
| `arrangement_type`       | TEXT        |
| `lives_with_family`      | BOOLEAN     |
| `depends_on_family`      | BOOLEAN     |
| `depends_on_caregiver`   | BOOLEAN     |
| `is_in_institution`      | BOOLEAN     |
| `institution_name`       | TEXT        |
| `institution_type`       | TEXT        |
| `receives_free_services` | BOOLEAN     |
| `receives_ration_grant`  | BOOLEAN     |
| `created_at`             | TIMESTAMPTZ |
| `updated_at`             | TIMESTAMPTZ |

---

### `aid_programs`
| Field                | Type        |
|----------------------|-------------|
| `id`                 | UUID        |
| `code`               | TEXT        |
| `name`               | TEXT        |
| `agency`             | TEXT        |
| `category`           | TEXT        |
| `description`        | TEXT        |
| `benefits`           | TEXT        |
| `application_method` | TEXT        |
| `official_url`       | TEXT        |
| `is_active`          | BOOLEAN     |
| `last_reviewed_at`   | DATE        |
| `created_at`         | TIMESTAMPTZ |
| `updated_at`         | TIMESTAMPTZ |

The initial BantuanKu V1.0 records are:

- [STR](../aid-programs/str.md)
- [BWE](../aid-programs/bwe.md)
- [BA](../aid-programs/ba.md)
- [BAT](../aid-programs/bat.md)
- [BPT](../aid-programs/bpt.md)
- [TBP](../aid-programs/tbp.md)

Eligibility rules are maintained in the TypeScript eligibility engine rather than this table.

---

### `program_profiles`
| Field        | Type        |
|--------------|-------------|
| `id`         | UUID        |
| `user_id`    | UUID        |
| `program_id` | UUID        |
| `data`       | JSONB       |
| `created_at` | TIMESTAMPTZ |
| `updated_at` | TIMESTAMPTZ |

A user should have at most one program profile for each aid program.

This allows program-specific questions to be added or modified without expanding the shared beneficiary tables.

---

### `saved_programs`
| Field        | Type        |
|--------------|-------------|
| `id`         | UUID        |
| `user_id`    | UUID        |
| `program_id` | UUID        |
| `created_at` | TIMESTAMPTZ |

The combination of `user_id` and `program_id` should be unique.

---
### `reminders`
| Field            | Type        |
|------------------|-------------|
| `id`             | UUID        |
| `user_id`        | UUID        |
| `program_id`     | UUID        |
| `application_id` | UUID        |
| `title`          | TEXT        |
| `description`    | TEXT        |
| `reminder_at`    | TIMESTAMPTZ |
| `is_completed`   | BOOLEAN     |
| `created_at`     | TIMESTAMPTZ |
| `updated_at`     | TIMESTAMPTZ |

`program_id` and `application_id` may be nullable depending on the reminder.

---

### `documents`
| Field               | Type        |
|---------------------|-------------|
| `id`                | UUID        |
| `profile_id`        | UUID        |
| `document_type`     | TEXT        |
| `original_filename` | TEXT        |
| `storage_path`      | TEXT        |
| `mime_type`         | TEXT        |
| `file_size_bytes`   | BIGINT      |
| `issued_at`         | DATE        |
| `expires_at`        | DATE        |
| `created_at`        | TIMESTAMPTZ |
| `updated_at`        | TIMESTAMPTZ |

`profile_id` references `profiles.id`.

The actual files are stored in the private `user-documents` Supabase Storage bucket. PostgreSQL stores only document 
metadata and the relative Storage object path.

`storage_path` is unique so that each document record refers to a specific Storage object.

Multiple documents with the same `document_type` may belong to the same profile. This supports cases such as users 
providing multiple income proof documents.

`document_type` uses the controlled document type vocabulary defined by the application in `../../src/constants/profile/documents.ts`.
The database currently stores the value as `TEXT`, while the application layer restricts it through the `DocumentType` 
TypeScript type.

The current document type vocabulary includes:

```text
identity_document
birth_certificate
marriage_certificate
divorce_certificate
spouse_death_certificate
adoption_certificate
income_proof
income_declaration
bank_account_proof
utility_bill
oku_registration
medical_confirmation
medical_recommendation
medical_referral
equipment_quotation
medical_cost_document
other
```

---

### `applications`
| Field                    | Type        |
|--------------------------|-------------|
| `id`                     | UUID        |
| `profile_id`             | UUID        |
| `program_id`             | UUID        |
| `status`                 | TEXT        |
| `current_step`           | TEXT        |
| `simulated_submitted_at` | TIMESTAMPTZ |
| `created_at`             | TIMESTAMPTZ |
| `updated_at`             | TIMESTAMPTZ |

`profile_id` references `profiles.id` and `program_id` references `aid_programs.id`.

Application statuses may include:

- `draft`
- `in_progress`
- `ready_for_review`
- `simulated_submitted`

No government approval status is stored because BantuanKu does not perform actual government submission or approval.

---

### `application_data`
| Field            | Type        |
|------------------|-------------|
| `id`             | UUID        |
| `application_id` | UUID        |
| `data`           | JSONB       |
| `created_at`     | TIMESTAMPTZ |
| `updated_at`     | TIMESTAMPTZ |

`application_id` references `applications.id`.

Using JSONB allows different aid programs to collect different application information without creating separate application tables for each program.

---

### `application_documents`
| Field              | Type        |
|--------------------|-------------|
| `id`               | UUID        |
| `application_id`   | UUID        |
| `document_id`      | UUID        |
| `requirement_type` | TEXT        |
| `created_at`       | TIMESTAMPTZ |

`application_id` references `applications.id` and `document_id` references `documents.id`.

The same document can be reused across multiple simulated applications without storing duplicate files.

The combination of `application_id`, `document_id` and `requirement_type` is unique.

Documents attached to a `simulated_submitted` application are treated as locked application evidence and should not be 
replaced or deleted. A user may upload a new document instead.

---

## Registration Documents
Supporting documents in Registration Step 5 are optional.

The initial registration document categories are:

| Document                | `document_type`      | Multiple |
|-------------------------|----------------------|----------|
| Identification Document | `identity_document`  | No       |
| Income Document         | `income_proof`       | Yes      |
| Proof of Address        | `utility_bill`       | No       |
| Bank Account Proof      | `bank_account_proof` | No       |

Registration can be completed without uploading supporting documents.

During registration, selected documents are uploaded only after the user's Auth account and beneficiary profile have 
been successfully created.

A failure to upload an optional document does not invalidate an otherwise successful registration.

---

## Supabase Storage
Supporting documents are stored in the private Supabase Storage bucket:

```text
user-documents
```

The current Storage object structure is:

```text
user-documents/
└── {auth_user_id}/
    └── {document_type}/
        └── {file_id}.{extension}
```

For example:

```text
user-documents/
└── 39de689a-3ac4-4a2e-b19d-62f538a5b7af/
    ├── identity_document/
    │   └── 8d42f8b1-....pdf
    ├── income_proof/
    │   ├── a914e32c-....pdf
    │   └── b821a117-....png
    └── bank_account_proof/
        └── c721d92f-....jpg
```

Each uploaded object uses a generated UUID filename rather than the original filename. The original filename is preserved in `documents.original_filename`.

The current upload restrictions are:

| Restriction       | Value             |
|-------------------|-------------------|
| Bucket visibility | Private           |
| Maximum file size | 10 MB per file    |
| PDF               | `application/pdf` |
| JPEG              | `image/jpeg`      |
| PNG               | `image/png`       |

Only the relative Storage path is stored in `documents.storage_path`.

### Storage and Database Ownership
Storage ownership and database document ownership use different identifiers:

```text
Supabase Authentication
auth.users.id
      │
      ├── Storage path ownership
      │   └── {auth_user_id}/...
      │
      └── profiles.user_id
              │
              └── profiles.id
                      │
                      └── documents.profile_id
```

Therefore:

- Storage objects are organized using the authenticated user's `auth.users.id`.
- Document metadata is associated with the beneficiary using `profiles.id`.
- `documents.storage_path` connects the database record to its Storage object.

---

## Row Level Security
Row Level Security (RLS) is used to protect user-owned BantuanKu data.

Authenticated users may access only records associated with their own beneficiary profile according to the configured 
table policies.

RLS is also enabled for `storage.objects` in the private `user-documents` bucket.

Storage policies restrict authenticated users to objects whose first path segment matches their Supabase Auth user ID:

```text
{auth.uid()}/{document_type}/{file_id}.{extension}
```

The Storage policies cover:

- Reading owned documents
- Uploading owned documents
- Updating owned documents
- Deleting owned documents

RLS provides the database and Storage ownership boundary. Additional business rules may also be enforced by the application
where required.

---

## Document Replacement and Deletion
Documents are identified by their specific `documents.id` rather than only by document type or filename.

When an existing document is replaced before simulated submission:

```text
Upload new Storage object
        ↓
Update the existing documents record
        ↓
Delete the old Storage object
```

The replacement uses a newly generated Storage object UUID.

If the database update fails, the newly uploaded Storage object should be removed to avoid leaving an unused file.

Documents associated with a `simulated_submitted` application should not be modified or deleted because they represent the evidence associated with that simulated submission.

A new document should be uploaded instead when updated evidence is required.

---

## Data Outside the Database
The following are intentionally not stored as persistent database records:
- Eligibility rules
- Eligibility recommendation results
- Intermediate rule evaluation state
- Derived age
- Derived household size
- Derived number of dependants
- Derived per-capita household income
- Fictional mock government records

Eligibility rules and calculations are handled by the TypeScript eligibility engine.

Fictional external records used for mock verification remain within the mock verification module and are clearly separated
from actual user data.

---

## Data Derivation
BantuanKu avoids storing values that can be reliably derived from existing information.

Examples include:

| Derived Information                 | Source                                 |
|-------------------------------------|----------------------------------------|
| Age                                 | `profiles.date_of_birth`               |
| Household size                      | `household_members`                    |
| Number of dependants                | `household_members.is_dependent`       |
| Per-capita household income         | Household income and household size    |
| Continuous-treatment duration       | `health_profiles.treatment_start_date` |
| State / Federal Territory residence | Primary address                        |
| Eligibility outcome                 | TypeScript eligibility engine          |

This reduces duplicated data and helps keep eligibility calculations consistent.

---

## Extensibility
The database separates shared beneficiary information from program-specific information.

Shared information is stored in structured relational tables and can be reused across multiple aid programs.

Program-specific information can be stored using flexible JSONB structures such as `program_profiles.data` and `application_data.data`
where appropriate.

Supporting documents are stored independently from applications and connected through `application_documents`, 
allowing the same document to be reused across multiple simulated applications.

Eligibility rules remain outside the database so that program criteria can be maintained and tested independently from 
beneficiary data.

This structure allows additional aid programs, eligibility rules, document requirements and program-specific fields to be
introduced without requiring major changes to the shared beneficiary schema.
