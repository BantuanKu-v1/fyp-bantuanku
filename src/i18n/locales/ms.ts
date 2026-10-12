const ms = {
  translation: {
    common: {
      back: "Kembali",
      continue: "Teruskan",
      done: "Selesai",
      close: "Tutup",
      cancel: "Batal",
      ok: "OK",
      remove: "Buang",
      complete: "Selesai",
      edit: "Edit",
      save: "Simpan",
      saving: "Menyimpan",
      discard: "Buang",
      keepEditing: "Teruskan mengedit",

      yes: "Ya",
      no: "Tidak",
      notProvided: "Tidak dinyatakan",

      selectDate: "Pilih tarikh",
      selectOption: "Pilih pilihan",

      discardChanges: {
        title: "Buang perubahan?",
        message: "Anda mempunyai perubahan yang belum disimpan. Jika anda keluar sekarang, perubahan tersebut akan hilang.",
      },
    },

    language: {
      title: "Bahasa",
      english: "English",
      malay: "Bahasa Melayu",
      chinese: "中文",
    },

    auth: {
      common: {
        backToLogin: "Kembali ke Log Masuk",
      },

      login: {
        title: "Selamat kembali",
        subtitle: "Log masuk untuk meneruskan ke BantuanKu.",
        email: "E-mel",
        emailPlaceholder: "Masukkan e-mel anda",
        password: "Kata Laluan",
        passwordPlaceholder: "Masukkan kata laluan anda",
        forgotPassword: "Lupa kata laluan?",
        signIn: "Log Masuk",
        noAccount: "Belum mempunyai akaun?",
        createAccount: "Cipta akaun",
        unableToSignIn: "Tidak dapat log masuk",

        errors: {
          invalidCredentials: "E-mel atau kata laluan yang anda masukkan tidak betul.",
          signInFailed: "Tidak dapat log masuk. Sila cuba lagi.",
        },
      },

      forgotPassword: {
        title: "Lupa Kata Laluan?",
        subtitle: "Masukkan alamat e-mel anda dan kami akan menghantar pautan untuk menetapkan semula kata laluan anda.",
        sentSubtitle: "Semak e-mel anda untuk meneruskan penetapan semula kata laluan.",

        sendResetLink: "Hantar Pautan Tetapan Semula",

        emailSent: "E-mel Tetapan Semula Dihantar",
        emailSentDescription: "Jika akaun wujud untuk e-mel ini, pautan tetapan semula kata laluan telah dihantar. Semak peti e-mel anda untuk meneruskan.",

        unableToSend: "Tidak Dapat Menghantar E-mel",

        errors: {
          sendFailed: "Kami tidak dapat menghantar e-mel tetapan semula kata laluan. Sila cuba lagi.",
        },
      },

      resetPassword: {
        title: "Tetapkan Semula Kata Laluan",
        subtitle: "Masukkan kata laluan baharu anda di bawah.",
        successSubtitle: "Kata laluan anda telah berjaya dikemas kini.",

        newPassword: "Kata Laluan Baharu",
        newPasswordPlaceholder: "Masukkan kata laluan baharu anda",

        confirmPassword: "Sahkan Kata Laluan Baharu",
        confirmPasswordPlaceholder: "Masukkan semula kata laluan baharu anda",

        resetPassword: "Tetapkan Semula Kata Laluan",

        success: "Kata Laluan Berjaya Ditetapkan Semula",
        successDescription: "Kata laluan anda telah dikemas kini. Anda kini boleh log masuk menggunakan kata laluan baharu anda.",

        unableToReset: "Tidak Dapat Menetapkan Semula Kata Laluan",

        errors: {
          resetFailed: "Kami tidak dapat menetapkan semula kata laluan anda. Sila cuba lagi.",
        },
      },

      register: {
        registering: "Sedang mencipta akaun anda...",
        registeringDescription: "Sila tunggu sementara kami menyediakan profil anda.",

        progress: {
          account: "Akaun",
          personal: "Peribadi",
          residence: "Alamat",
          household: "Isi Rumah",
          documents: "Dokumen",
        },

        account: {
          title: "Cipta Akaun",
          subtitle: "Cipta akaun anda untuk bermula.",

          email: "E-mel",
          emailPlaceholder: "Masukkan e-mel anda",

          password: "Kata Laluan",
          passwordPlaceholder: "Gunakan sekurang-kurangnya 8 aksara.",

          confirmPassword: "Sahkan Kata Laluan",
          confirmPasswordPlaceholder: "Masukkan semula kata laluan anda",

          alreadyHaveAccount: "Sudah mempunyai akaun?",
          signIn: "Log masuk",
        },

        personal: {
          title: "Maklumat Peribadi",
          subtitle: "Beritahu kami tentang individu yang akan menerima cadangan bantuan.",

          fullName: "Nama Penuh",
          fullNamePlaceholder: "Masukkan nama penuh",

          icNumber: "Nombor Kad Pengenalan",
          icNumberPlaceholder: "XXXXXX-XX-XXXX",

          dateOfBirth: "Tarikh Lahir",
          dobFromIc: "Diisi secara automatik.",

          citizenship: "Kewarganegaraan",
          selectCitizenship: "Pilih kewarganegaraan",
          malaysian: "Warganegara Malaysia",
          nonMalaysian: "Bukan Warganegara Malaysia",

          mobileNumber: "Nombor Telefon Bimbit",
          mobilePlaceholder: "012-3456789",
        },

        residence: {
          title: "Tempat Tinggal",
          subtitle: "Beritahu kami tempat tinggal semasa penerima bantuan",

          addressLine1: "Alamat Baris 1",
          addressLine1Placeholder: "Nombor rumah/unit dan jalan",

          addressLine2: "Alamat Baris 2",
          addressLine2Placeholder: "Bangunan, apartmen atau kawasan perumahan",

          postcode: "Poskod",
          postcodePlaceholder: "cth. 50000",

          city: "Bandar",
          cityPlaceholder: "cth. Kuala Lumpur",

          stateTerritory: "Negeri / Wilayah Persekutuan",
          selectStateTerritory: "Pilih negeri atau Wilayah Persekutuan",

          locationAutoHelper: "Bandar dan negeri diisi secara automatik berdasarkan poskod anda.",
          locationManualHelper: "Kami tidak dapat mendapatkan lokasi anda. Sila masukkan bandar dan negeri secara manual."
        },

        householdIncome: {
          title: "Isi Rumah & Pendapatan",
          subtitle: "Beritahu kami tentang isi rumah dan pendapatan penerima bantuan.",

          employmentStatus: "Status Pekerjaan",
          selectEmploymentStatus: "Pilih status pekerjaan",

          employmentStatusOptions: {
            employed: "Bekerja",
            selfEmployed: "Bekerja sendiri",
            unemployed: "Menganggur",
            retired: "Bersara",
            notWorking: "Tidak bekerja",
          },

          incomeSource: "Sumber Pendapatan",
          selectIncomeSource: "Pilih sumber pendapatan",

          incomeSourceOptions: {
            salary: "Gaji",
            selfEmployment: "Pendapatan bekerja sendiri",
            pension: "Pencen",
            governmentAssistance: "Bantuan kerajaan",
            familySupport: "Sokongan keluarga",
            savings: "Simpanan",
            other: "Lain-lain",
            noIncome: "Tiada pendapatan",
          },

          personalMonthlyIncome: "Pendapatan Bulanan Peribadi (RM)",
          householdMonthlyIncome: "Pendapatan Kasar Bulanan Isi Rumah (RM)",

          householdMembers: "Ahli Isi Rumah",
          householdMembersHelper: "Tambah individu lain yang tinggal dalam isi rumah yang sama dengan penerima bantuan.",

          householdMember: "Ahli Isi Rumah {{number}}",

          memberFullName: "Nama Penuh",
          memberFullNamePlaceholder: "Masukkan nama penuh ahli isi rumah",

          relationship: "Hubungan",
          selectRelationship: "Pilih hubungan",

          relationshipOptions: {
            spouse: "Pasangan",
            child: "Anak",
            parent: "Ibu atau bapa",
            sibling: "Adik-beradik",
            grandchild: "Cucu",
            other: "Lain-lain",
          },

          memberDateOfBirth: "Tarikh Lahir",

          addHouseholdMember: "Tambah Ahli Isi Rumah",
          removeHouseholdMember: "Buang ahli isi rumah",

          livingAloneHelper: "Jika penerima bantuan tinggal bersendirian, anda tidak perlu menambah ahli isi rumah.",

          removeMemberDialog: {
            title: "Buang ahli isi rumah?",
            message: "Maklumat yang dimasukkan untuk ahli isi rumah ini akan dibuang.",
          },
        },

        documents: {
          title: "Dokumen Sokongan",
          subTitle: "Muat naik dokumen yang anda sudah miliki untuk memudahkan permohonan bantuan pada masa akan datang.",

          optional: "Dokumen adalah pilihan. Anda boleh menambah atau mengemas kini dokumen kemudian melalui profil anda.",

          identity: {
            title: "Dokumen Pengenalan",
            description: "MyKad, MyPR atau dokumen pengenalan lain",
          },

          income: {
            title: "Dokumen Pendapatan",
            description: "Slip gaji, penyata pendapatan majikan atau pengisytiharan pendapatan",
          },

          address: {
            title: "Bukti Alamat",
            description: "Bil utiliti yang memaparkan alamat kediaman anda",
          },

          bank: {
            title: "Bukti Akaun Bank",
            description: "Penyata bank atau pengesahan akaun bank",
          },

          upload: "Muat Naik",
          addAnother: "Tambah lagi",
          replace: "Ganti",

          fileRequirements: "PDF, JPG atau PNG • Maksimum 10 MB bagi setiap fail",

          error: {
            title: "Ralat Dokumen",
            invalidFileType: "Sila pilih fail PDF, JPG atau PNG.",
            fileTooLarge: "Fail yang dipilih mestilah bersaiz 10 MB atau kurang.",
            selectionFailed: "Dokumen ini tidak dapat dipilih. Sila cuba lagi.",
          },
        },

        errors: {
          title: "Pendaftaran tidak dapat diselesaikan",
          incompleteRegistration: "Sesetengah maklumat pendaftaran tidak lengkap. Sila semak langkah sebelumnya.",
          languageUnavailable: "Bahasa pilihan anda tidak dapat dikenal pasti.",
          registrationFailed: "Pendaftaran tidak dapat diselesaikan. Sila cuba lagi.",
          identificationNumberExists: "Nombor kad pengenalan ini telah didaftarkan.",
        },
      },
    },

    profile: {
      title: "Profil",
      description: "Urus maklumat peribadi dan isi rumah anda.",

      sections: {
        personal: "Peribadi",
        householdFinancial: "Isi Rumah & Kewangan",
        contactResidence: "Hubungan & Tempat Tinggal",
        preferences: "Keutamaan",
        account: "Akaun",
      },

      personalInformation: {
        title: "Maklumat Peribadi",
        description: "Maklumat peribadi dan demografi",

        personalDetails: "Butiran Peribadi",
        contact: "Maklumat Hubungan",

        fullName: "Nama Penuh",
        identificationNumber: "Nombor Kad Pengenalan",
        dateOfBirth: "Tarikh Lahir",
        gender: "Jantina",
        citizenship: "Kewarganegaraan",
        mobileNumber: "Nombor Telefon Bimbit",

        male: "Lelaki",
        female: "Perempuan",

        malaysian: "Warganegara Malaysia",
        nonMalaysian: "Bukan Warganegara Malaysia",

        notProvided: "Tidak diberikan",
        updateFailed: "Nombor telefon anda tidak dapat dikemaskini. Sila cuba lagi.",
      },

      household: {
        title: "Isi Rumah Saya",
        youOnly: "Anda sahaja",
        oneMember: "Anda + 1 ahli isi rumah",
        multipleMembers: "Anda + {{count}} ahli isi rumah",

        members: "Ahli Isi Rumah",
        addMember: "Tambah Ahli Isi Rumah",
        notProvided: "Tidak dinyatakan",

        empty: {
          title: "Tiada Ahli Isi Rumah",
          description: "Tambah individu yang tinggal dalam isi rumah yang sama dengan anda.",
        },

        relationship: {
          spouse: "Pasangan",
          child: "Anak",
          parent: "Ibu / Bapa",
          sibling: "Adik-beradik",
          grandchild: "Cucu",
          other: "Lain-lain",
        },

        member: {
          fullName: "Nama Penuh",
          relationship: "Hubungan",
          dateOfBirth: "Tarikh Lahir",
        },

        add: {
          selectRelationship: "Pilih hubungan",

          sections: {
            basicInformation: "Maklumat Asas",
            employmentIncome: "Pekerjaan & Pendidikan",
            education: "Pendidikan",
            disability: "Ketidakupayaan / OKU",
          },

          fields: {
            citizenship: "Kewarganegaraan",
            identificationNumber: "No. Kad Pengenalan / Pengenalan Diri",
            gender: "Jantina",
            isDependent: "Adakah individu ini bergantung kepada anda dari segi kewangan?",
            employmentStatus: "Status Pekerjaan",
            occupation: "Pekerjaan",
            monthlyIncome: "Pendapatan Bulanan (RM)",
            isStudent: "Adakah individu ini seorang pelajar?",
            studyMode: "Mod Pengajian",
            institutionType: "Jenis Institusi",
            isOku: "Adakah individu ini orang kurang upaya (OKU)?",
            okuRegistered: "Adakah individu ini berdaftar sebagai OKU?",
          },

          options: {
            male: "Lelaki",
            female: "Perempuan",

            malaysian: "Warganegara Malaysia",
            nonMalaysian: "Bukan Warganegara Malaysia",

            employed: "Bekerja",
            selfEmployed: "Bekerja Sendiri",
            unemployed: "Tidak Bekerja",
            student: "Pelajar",
            retired: "Bersara",
            homemaker: "Suri Rumah",

            fullTime: "Sepenuh Masa",
            partTime: "Separuh Masa",

            school: "Sekolah",
            college: "Kolej",
            university: "Universiti",
            other: "Lain-lain",
          },

          errorTitle: "Gagal Menambah Ahli Isi Rumah",
          errorDescription: "Kami tidak dapat menyimpan maklumat ahli isi rumah ini. Sila cuba lagi.",
        },
      },

      incomeEmployment: {
        title: "Pendapatan & Pekerjaan",
        noInformation: "Maklumat pekerjaan",

        status: {
          employed: "Bekerja",
          selfEmployed: "Bekerja sendiri",
          unemployed: "Menganggur",
          retired: "Bersara",
          notWorking: "Tidak bekerja",
        },
      },

      residentialAddress: {
        title: "Alamat Kediaman",
        noAddress: "Tiada alamat diberikan",
        country: "Negara",
      },

      language: {
        title: "Bahasa",

        selectLanguageTitle: "Pilih Bahasa",
        selectLanguageDescription: "Pilih bahasa yang ingin anda gunakan."
      },

      account: {
        signOut: "Log Keluar",
        signOutDescription: "Adakah anda pasti mahu log keluar daripada akaun anda?"
      },

      errors: {
        loadTitle: "Tidak dapat memuatkan profil",
        loadDescription: "Maklumat profil anda tidak dapat dimuatkan.",
        tryAgain: "Cuba Lagi",
      },
    },

    validation: {
      required: "Medan ini wajib diisi.",

      emailRequired: "E-mel diperlukan.",
      emailInvalid: "Masukkan alamat e-mel yang sah.",

      passwordRequired: "Kata laluan diperlukan.",
      passwordTooShort: "Kata laluan mestilah sekurang-kurangnya 8 aksara.",

      confirmPasswordRequired: "Sila sahkan kata laluan anda.",
      passwordMismatch: "Kata laluan tidak sepadan.",

      fullNameRequired: "Nama penuh diperlukan.",

      myKadNumberRequired: "Nombor kad pengenalan diperlukan.",
      myKadNumberInvalid: "Masukkan nombor kad pengenalan yang sah.",

      dateOfBirthRequired: "Tarikh lahir diperlukan.",
      dateOfBirthInvalid: "Masukkan tarikh lahir yang sah.",
      dateOfBirthMismatch: "Tarikh lahir tidak sepadan dengan nombor kad pengenalan.",

      citizenshipRequired: "Kewarganegaraan diperlukan.",

      mobileNumberRequired: "Nombor telefon bimbit diperlukan.",
      mobileNumberInvalid: "Masukkan nombor telefon bimbit Malaysia yang sah.",

      addressLine1Required: "Alamat baris 1 diperlukan.",

      postcodeRequired: "Poskod diperlukan.",
      postcodeInvalid: "Masukkan poskod 5 digit yang sah.",

      cityRequired: "Bandar diperlukan.",
      stateTerritoryRequired: "Negeri atau Wilayah Persekutuan diperlukan.",

      employmentStatusRequired: "Status pekerjaan diperlukan.",

      incomeSourceRequired: "Sumber pendapatan diperlukan.",
      personalMonthlyIncomeRequired: "Pendapatan bulanan peribadi diperlukan.",
      householdMonthlyIncomeRequired: "Pendapatan kasar bulanan isi rumah diperlukan.",
      monthlyIncomeInvalid: "Masukkan pendapatan bulanan yang sah.",

      householdMemberNameRequired: "Nama ahli isi rumah diperlukan.",
      relationshipRequired: "Hubungan diperlukan.",
      householdMemberDobRequired: "Tarikh lahir ahli isi rumah diperlukan.",

      identificationNumberInvalid: "Masukkan nombor pengenalan yang sah.",
    },
  },
};

export default ms;
