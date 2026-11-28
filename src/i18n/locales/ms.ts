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

      retry: "Cuba Lagi",
      error: "Sesuatu telah berlaku",
      errorDescription: "Kami tidak dapat memuatkan maklumat ini. Sila cuba lagi.",

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
            homemaker: "Suri rumah",
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
        household: "Isi Rumah",
        residence: "Tempat Tinggal",
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

        maritalStatus: "Status Perkahwinan",
        homePhone: "Telefon Rumah",

        personalCircumstances: "Maklumat Peribadi Tambahan",
        financialInformation: "Maklumat Kewangan",
        studentStatus: "Status Pelajar",
        okuStatus: "Status OKU",

        updateCircumstancesFailed: "Maklumat peribadi tambahan anda tidak dapat dikemaskini. Sila cuba lagi.",
        updateFinancialFailed: "Maklumat kewangan anda tidak dapat dikemaskini. Sila cuba lagi.",
        updateHomePhoneFailed: "Tidak dapat mengemas kini nombor telefon rumah anda. Sila cuba lagi.",
      },

      household: {
        title: "Isi Rumah Saya",
        youOnly: "Anda sahaja",
        oneMember: "Anda + 1 ahli isi rumah",
        multipleMembers: "Anda + {{count}} ahli isi rumah",

        members: "Ahli Isi Rumah",
        addMember: "Tambah Ahli Isi Rumah",
        editMember: "Edit Ahli Isi Rumah",
        completeInformation: "Lengkapkan maklumat yang belum diisi",
        missingInformation: "Belum diisi",
        moreFields: "+{{count}} lagi",

        empty: {
          title: "Tiada Ahli Isi Rumah",
          description: "Tambah individu yang tinggal dalam isi rumah yang sama dengan anda.",
        },

        loadError: {
          title: "Tidak Dapat Memuatkan Maklumat Ahli Isi Rumah",
          description: "Kami tidak dapat memuatkan maklumat ahli isi rumah ini. Sila cuba lagi.",
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
            unemployed: "Menganggur",
            retired: "Bersara",
            homemaker: "Suri Rumah",
            notWorking: "Tidak bekerja",

            fullTime: "Sepenuh Masa",
            partTime: "Separuh Masa",

            school: "Sekolah",
            ipta: "Institusi Pengajian Tinggi Awam",
            ipts: "Pengajian Tinggi Swasta",
            other: "Lain-lain",
          },

          errorTitle: "Gagal Menambah Ahli Isi Rumah",
          errorDescription: "Kami tidak dapat menyimpan maklumat ahli isi rumah ini. Sila cuba lagi.",
        },

        edit: {
          errorTitle: "Gagal Mengemas Kini Ahli Isi Rumah",
          errorDescription: "Kami tidak dapat mengemas kini maklumat ahli isi rumah ini. Sila cuba lagi.",
        },

        confirmation: {
          title: "Pengesahan Isi Rumah",
          description: "Sila semak senarai ahli isi rumah anda dan sahkan bahawa semua ahli telah disenaraikan, termasuk jika anda tinggal bersendirian. Anda masih boleh menambah atau mengedit ahli isi rumah selepas pengesahan, tetapi anda perlu mengesahkan semula.",
          confirmed: "Maklumat isi rumah telah disahkan.",
          agreement: "Saya mengesahkan bahawa maklumat ahli isi rumah saya adalah lengkap dan tepat.",
          button: "Sahkan Maklumat Isi Rumah",
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

    applications: {
      title: "Permohonan Saya",
      description: "Jejaki permohonan bantuan yang telah dihantar dan status terkini.",

      totalApplications: "Jumlah Permohonan",
      myApplications: "Sejarah Permohonan",

      status: "Status Permohonan",
      lastUpdated: "Kemas Kini Terakhir",

      statuses: {
        draft: "Draf",
        inProgress: "Dalam Proses",
        readyForReview: "Sedia untuk Semakan",
        submitted: "Telah Dihantar",
        underReview: "Dalam Semakan",
        additionalInformationRequired: "Maklumat Tambahan Diperlukan",
        approved: "Diluluskan",
        rejected: "Ditolak",
        cancelled: "Dibatalkan",
      },

      submissionStates: {
        pending: "Penghantaran Belum Selesai",
        failed: "Penghantaran Gagal",
        unknown: "Penghantaran Belum Disahkan",
      },

      empty: {
        title: "Belum Ada Permohonan",
        description:
            "Anda belum menghantar sebarang permohonan bantuan. Selepas menghantar permohonan, anda boleh menyemak statusnya di sini.",
      },

      errors: {
        loadTitle: "Tidak Dapat Memuatkan Permohonan",
        loadDescription:
            "Kami tidak dapat mendapatkan senarai permohonan anda. Sila semak sambungan internet dan cuba lagi.",
      },

      buttons: {
        retrieveConfirmation: "Dapatkan Pengesahan Penghantaran",
      },

      eligibility: {
        title: "Penilaian Kelayakan Awal",

        status: "Status Kelayakan",
        criteriaVersion: "Versi Kriteria",
        assessedAt: "Tarikh Penilaian",

        statuses: {
          potentially_eligible: "Berpotensi Layak",
          potentially_ineligible: "Berpotensi Tidak Layak",
          insufficient_information: "Maklumat Tidak Mencukupi",
          manual_verification: "Pengesahan Manual Diperlukan",
        },

        notAvailable: "Tiada penilaian kelayakan awal tersedia untuk permohonan ini.",
        notAssessed: "Kelayakan awal anda akan dinilai sebelum permohonan dihantar.",

        disclaimer: "Penilaian awal ini disediakan oleh BantuanKu dan tidak mewakili keputusan rasmi permohonan STR.",
      },

      str: {
        title: "Permohonan STR",
        description: "Semak maklumat anda sebelum menghantar permohonan STR.",

        sections: {
          applicationDetails: "Butiran Permohonan",
          applicantInformation: "Maklumat Pemohon",
          applicationReadiness: "Kesediaan Permohonan",
          submissionConfirmation: "Pengesahan Penghantaran",
        },

        fields: {
          program: "Program Bantuan",
          agency: "Agensi",
          applicationId: "ID Permohonan",
          status: "Status Permohonan",
          fullName: "Nama Penuh",
          identificationNo: "Nombor Kad Pengenalan",
          dateOfBirth: "Tarikh Lahir",
          citizenship: "Kewarganegaraan",
          referenceNo: "Nombor Rujukan",
          providerApplicationId: "ID Permohonan STR",
          providerStatus: "Status STR",
          submittedAt: "Tarikh Penghantaran",
        },

        readiness: {
          applicant: "Maklumat Pemohon",
          address: "Alamat Kediaman",
          household: "Maklumat Isi Rumah",
          householdMembers: "Ahli Isi Rumah",
          complete: "Lengkap",
          incomplete: "Belum Lengkap",
        },

        buttons: {
          submit: "Hantar Permohonan STR",
          alreadySubmitted: "Permohonan Telah Dihantar",
          refresh: "Muat Semula Maklumat",
          cancel: "Batal",
          confirm: "Sahkan Penghantaran",
        },

        messages: {
          loading: "Sedang memuatkan permohonan STR anda...",
          loadError: "Tidak dapat memuatkan permohonan STR anda. Sila cuba lagi.",
          notProvided: "Tidak dinyatakan",
          notAvailable: "Tidak tersedia",
          attentionRequired: "Perhatian Diperlukan",
          missingInformation: "Lengkapkan maklumat yang belum diisi dalam profil anda sebelum menghantar permohonan.",
          confirmTitle: "Hantar Permohonan STR?",
          confirmDescription: "Sila sahkan bahawa maklumat anda adalah tepat sebelum menghantar permohonan kepada STR.",
          successTitle: "Permohonan Telah Dihantar",
          successDescription: "Permohonan STR anda berjaya dihantar. Nombor rujukan: {{referenceNo}}",
          submissionError: "Tidak dapat menghantar permohonan STR anda. Sila cuba lagi.",
          alreadySubmittedTitle: "Permohonan Telah Dihantar Sebelum Ini",
          alreadySubmittedDescription: "Permohonan STR anda telah dihantar. Anda tidak perlu menghantarnya sekali lagi.",
          existingConfirmation: "Ini ialah pengesahan daripada penghantaran anda yang terdahulu.",
          submissionUncertain: "Kami tidak dapat mengesahkan sama ada STR telah menerima permohonan anda. Muat semula dan semak status sebelum mencuba lagi.",
          invalidConfirmation: "Perkhidmatan STR mengembalikan pengesahan penghantaran yang tidak sah. Sila semak status permohonan anda.",
        },
      },

      jkm: {
        title: "Permohonan {{programCode}}",
        description: "Semak maklumat anda dan lengkapkan butiran yang diperlukan sebelum menghantar permohonan JKM anda.",

        sections: {
          applicationDetails: "Butiran Permohonan",
          applicantInformation: "Maklumat Pemohon",
          applicationReadiness: "Kesediaan Permohonan",
          programSpecificInformation: "Maklumat Khusus Program",
          supportingDocuments: "Dokumen Sokongan",
          preliminaryEligibility: "Kelayakan Awal",
          applicationReview: "Semakan Permohonan",
          submissionConfirmation: "Pengesahan Penghantaran",
        },

        fields: {
          program: "Program Bantuan",
          agency: "Agensi",
          applicationId: "ID Permohonan",
          status: "Status Permohonan",

          fullName: "Nama Penuh",
          identificationNo: "Nombor Kad Pengenalan",
          dateOfBirth: "Tarikh Lahir",
          citizenship: "Kewarganegaraan",

          referenceNo: "Nombor Rujukan",
          providerApplicationId: "ID Permohonan JKM",
          providerStatus: "Status JKM",
          submittedAt: "Tarikh Penghantaran",
        },

        readiness: {
          applicant: "Maklumat Pemohon",
          address: "Alamat Kediaman",
          household: "Maklumat Isi Rumah",
          householdMembers: "Ahli Isi Rumah",
          programSpecificData: "Maklumat Khusus Program",

          complete: "Lengkap",
          incomplete: "Tidak Lengkap",
          notRequired: "Tidak Diperlukan",
        },

        buttons: {
          submit: "Hantar Permohonan JKM",
          alreadySubmitted: "Permohonan Telah Dihantar",
          refresh: "Muat Semula Maklumat",
          saveDraft: "Simpan Draf",
          review: "Semak Permohonan",
          checkSubmission: "Semak Status Penghantaran",
          confirm: "Sahkan Penghantaran",
          submitting: "Sedang menghantar...",
        },

        messages: {
          loading: "Sedang memuatkan permohonan JKM anda...",
          loadError: "Permohonan JKM anda tidak dapat dimuatkan. Sila cuba lagi.",

          notAvailable: "Tidak tersedia",

          attentionRequired: "Perhatian Diperlukan",
          missingInformation: "Lengkapkan maklumat yang belum diisi dalam profil anda sebelum menghantar permohonan.",
          incompleteApplication: "Sila lengkapkan maklumat permohonan yang diperlukan sebelum menghantar.",

          draftSaved: "Draf permohonan anda telah disimpan.",
          draftSaveError: "Draf permohonan anda tidak dapat disimpan. Sila cuba lagi.",

          reviewDescription: "Sila semak maklumat dan pengisytiharan anda sebelum menghantar permohonan.",

          confirmTitle: "Hantar Permohonan JKM?",
          confirmDescription: "Sila pastikan maklumat dan pengisytiharan anda adalah tepat sebelum menghantar permohonan kepada JKM.",

          declaration: "Saya mengesahkan bahawa maklumat yang diberikan dalam permohonan ini adalah lengkap dan tepat.",

          successTitle: "Permohonan Berjaya Dihantar",
          successDescription: "Permohonan JKM anda telah berjaya dihantar. Nombor rujukan: {{referenceNo}}",

          submissionError: "Permohonan JKM tidak dapat dihantar.",
          submissionUncertain: "Penghantaran permohonan JKM tidak dapat disahkan. Sila semak status permohonan anda sebelum mencuba lagi.",
          invalidConfirmation: "Perkhidmatan JKM memberikan pengesahan penghantaran yang tidak sah. Sila semak status permohonan anda.",

          invalidProgram: "Program bantuan JKM tidak disokong.",
          invalidSubmissionState: "Status penghantaran luaran JKM tidak sah.",

          alreadySubmittedTitle: "Permohonan Telah Dihantar",
          alreadySubmittedDescription: "Permohonan JKM anda telah dihantar. Anda tidak perlu menghantarnya semula.",
          existingConfirmation: "Ini ialah pengesahan daripada penghantaran permohonan anda yang terdahulu.",

          pendingTitle: "Penghantaran Belum Selesai",
          pendingDescription: "Penghantaran permohonan anda sedang diproses. Sila semak statusnya sebelum mencuba lagi.",

          unknownTitle: "Status Penghantaran Tidak Diketahui",
          unknownDescription: "Kami tidak dapat mengesahkan sama ada JKM telah menerima permohonan anda. Maklumat permohonan tidak boleh disunting sehingga status penghantaran disahkan.",

          failedTitle: "Penghantaran Gagal",
          failedDescription: "Permohonan anda tidak berjaya dihantar. Semak maklumat anda sebelum mencuba lagi.",

          applicationLocked: "Permohonan ini tidak boleh disunting kerana penghantarannya sedang diproses, belum disahkan atau telah selesai.",

          eligibilityDisclaimer: "Keputusan kelayakan awal anda tidak menjamin kelulusan JKM. JKM mungkin memerlukan maklumat tambahan atau pengesahan.",
          simulationDisclaimer: "Permohonan ini dihantar kepada perkhidmatan simulasi JKM untuk tujuan demonstrasi sahaja.",
        },

        form: {
          required: "Wajib",
          optional: "Pilihan",

          textPlaceholder: "Masukkan butiran",
          amountPlaceholder: "Masukkan jumlah (RM)",
          countPlaceholder: "Masukkan nombor bulat",

          validation: {
            required: "Medan ini wajib diisi.",
            boolean: "Sila pilih Ya atau Tidak.",
            select: "Sila pilih pilihan yang tersedia.",
            number: "Masukkan nombor yang sah.",
            nonNegative: "Nilai negatif tidak dibenarkan.",
            integer: "Masukkan nombor bulat.",
            date: "Masukkan tarikh yang sah.",
            identificationNo: "Masukkan nombor pengenalan yang sah.",
            maxLength: "Masukkan tidak lebih daripada {{count}} aksara.",
            declarationRequired: "Sila sahkan pengisytiharan anda sebelum menghantar permohonan.",
          },
        },

        options: {
          citizenship: {
            malaysian: "Warganegara Malaysia",
            nonMalaysian: "Bukan Warganegara Malaysia",
          },

          relationship: {
            spouse: "Pasangan",
            child: "Anak",
            parent: "Ibu Bapa",
            sibling: "Adik-beradik",
            grandchild: "Cucu",
            other: "Lain-lain",
          },
        },

        health: {
          title: "Maklumat Kesihatan",

          isOku: "Adakah individu ini Orang Kurang Upaya (OKU)?",
          okuRegistered: "Adakah individu ini berdaftar sebagai OKU?",
          disabilityDescription: "Keterangan Ketidakupayaan",

          hasChronicIllness: "Adakah individu ini menghidap penyakit kronik?",
          chronicIllnessDetails: "Butiran Penyakit Kronik",

          isBedridden: "Adakah individu ini terlantar?",
          requiresContinuousTreatment: "Adakah individu ini memerlukan rawatan berterusan?",
          treatmentStartDate: "Tarikh Mula Rawatan",
        },

        programs: {
          ba: {
            title: "Bantuan Am",
            description: "Berikan maklumat tentang bantuan kebajikan sedia ada dan keadaan tambahan anda.",

            sections: {
              welfareAssistance: "Bantuan Kebajikan Sedia Ada",
              additionalCircumstances: "Keadaan Tambahan",
            },

            fields: {
              receivesOtherJkmMonthlyAssistance: "Adakah anda sedang menerima bantuan bulanan lain daripada JKM?",
              currentJkmAssistanceProgram: "Program Bantuan JKM Semasa",

              economicHardship: "Adakah anda menghadapi kesukaran ekonomi?",
              healthRelatedNeeds: "Adakah anda mempunyai keperluan tambahan berkaitan kesihatan?",
              dependentRelatedNeeds: "Adakah anda mempunyai keperluan tambahan berkaitan tanggungan?",
              otherCircumstances: "Adakah terdapat keadaan lain yang perlu dipertimbangkan oleh JKM?",

              description: "Keterangan Keadaan Tambahan",
            },

            validation: {
              currentProgramRequired: "Sila nyatakan nama program bantuan JKM yang sedang diterima.",
              inconsistentAssistance: "Sila semak pengisytiharan bantuan JKM sedia ada anda.",
              circumstancesDescriptionRequired: "Sila terangkan keadaan lain tersebut.",
            },
          },

          bat: {
            title: "Bantuan Alat Tiruan / Alat Sokongan",
            description: "Berikan maklumat tentang penerima bantuan, peralatan yang dipohon dan sokongan pengesyoran.",

            sections: {
              beneficiary: "Maklumat Penerima Bantuan",
              beneficiaryHealth: "Maklumat Kesihatan Penerima Bantuan",
              functionalLimitations: "Batasan Fungsi",
              equipment: "Maklumat Peralatan",
              recommendation: "Maklumat Pengesyoran",
              additionalJustification: "Justifikasi Tambahan",
            },

            fields: {
              beneficiaryType: "Siapakah yang akan menerima peralatan yang dipohon?",
              fullName: "Nama Penuh Penerima Bantuan",
              identificationNo: "Nombor Pengenalan Penerima Bantuan",
              relationshipToApplicant: "Hubungan dengan Pemohon",

              functionalLimitationDescription: "Terangkan batasan fungsi penerima bantuan.",

              equipmentType: "Jenis Peralatan",
              equipmentDescription: "Keterangan Peralatan",
              purpose: "Tujuan Penggunaan Peralatan",
              estimatedCost: "Anggaran Kos Peralatan (RM)",
              supplierName: "Nama Pembekal",
              quotationAvailable: "Adakah sebut harga peralatan tersedia?",

              recommendationAvailable: "Adakah pengesyoran sokongan tersedia?",
              recommendingAuthority: "Pihak yang Memberikan Pengesyoran",
              recommendationOfficerName: "Nama Pegawai yang Memberikan Pengesyoran",
              recommendationInstitution: "Institusi yang Memberikan Pengesyoran",
              recommendationDetails: "Butiran Pengesyoran",

              additionalJustification: "Justifikasi Tambahan Peralatan",
            },

            options: {
              beneficiaryType: {
                applicant: "Diri Sendiri",
                dependent: "Tanggungan Saya",
              },

              recommendingAuthority: {
                medicalOfficer: "Pegawai Perubatan",
                jkmOfficer: "Pegawai JKM",
                other: "Lain-lain",
              },
            },

            messages: {
              applicantBeneficiary: "Maklumat peribadi dan kesihatan anda akan digunakan sebagai maklumat penerima bantuan.",
              dependentBeneficiary: "Berikan maklumat tanggungan yang menerima bantuan. Maklumat kesihatan anda sendiri tidak akan digunakan untuk individu ini.",

              highCostEquipment: "Peralatan yang melebihi RM20,000 memerlukan justifikasi tambahan.",
              recommendationVerification: "JKM mungkin perlu mengesahkan pengesyoran dan peralatan yang dipohon.",
            },

            validation: {
              beneficiaryTypeRequired: "Sila pilih jenis penerima bantuan.",
              beneficiaryNameRequired: "Sila berikan nama penuh penerima bantuan.",
              beneficiaryRelationshipRequired: "Sila nyatakan hubungan penerima bantuan dengan anda.",
              dependentIdentificationConflict: "Nombor pengenalan tanggungan mestilah berbeza daripada nombor pengenalan pemohon.",

              equipmentTypeRequired: "Sila nyatakan jenis peralatan.",
              equipmentDescriptionRequired: "Sila terangkan peralatan yang dipohon.",
              equipmentPurposeRequired: "Sila terangkan tujuan penggunaan peralatan yang dipohon.",

              recommendingAuthorityRequired: "Sila nyatakan pihak yang memberikan pengesyoran.",
              recommendationDetailsRequired: "Sila berikan butiran pihak yang memberikan pengesyoran.",
              additionalJustificationRequired: "Justifikasi tambahan diperlukan bagi peralatan yang melebihi RM20,000.",
            },
          },

          bpt: {
            title: "Bantuan Penjagaan",
            description: "Berikan maklumat tentang pesakit, penjaga dan pengesahan perubatan.",

            sections: {
              applicationPathway: "Kategori Permohonan",
              patient: "Maklumat Pesakit",
              patientHealth: "Maklumat Kesihatan Pesakit",
              caregiver: "Maklumat Penjaga",
              medicalConfirmation: "Pengesahan Perubatan",
              additionalInformation: "Maklumat Tambahan",
            },

            fields: {
              applicationPathway: "Bagaimanakah anda memohon bantuan ini?",

              patient: {
                fullName: "Nama Penuh Pesakit",
                identificationNo: "Nombor Pengenalan Pesakit",
                citizenship: "Kewarganegaraan Pesakit",
                relationshipToApplicant: "Hubungan Pesakit dengan Pemohon",
              },

              caregiver: {
                fullName: "Nama Penuh Penjaga",
                identificationNo: "Nombor Pengenalan Penjaga",
                citizenship: "Kewarganegaraan Penjaga",
                relationship: "Hubungan dengan Pesakit",
                providesIntensiveCare: "Adakah penjaga memberikan penjagaan rapi?",
                eligiblePersonsCaredFor: "Bilangan Individu Layak yang Menerima Penjagaan",
              },

              medicalConfirmation: {
                medicalConfirmationAvailable: "Adakah pengesahan perubatan tersedia?",
                medicalInstitution: "Institusi Perubatan",
                medicalOfficerName: "Nama Pegawai Perubatan",
                diagnosisDetails: "Butiran Diagnosis",
                treatmentDetails: "Butiran Rawatan",
                specialistDetails: "Butiran Pakar Perubatan",
              },

              reasonForSelfApplication: "Sebab Permohonan Sendiri",
              additionalRemarks: "Catatan Tambahan",
            },

            options: {
              applicationPathway: {
                caregiver: "Memohon sebagai penjaga",
                nonBedriddenPatient: "Memohon sebagai pesakit kronik tidak terlantar",
                bedriddenPatientWithoutEligibleCaregiver: "Memohon sebagai pesakit terlantar tanpa penjaga yang layak",
              },

              reasonForSelfApplication: {
                noCaregiver: "Tiada penjaga",
                nonMalaysianCaregiver: "Penjaga bukan warganegara Malaysia",
              },
            },

            messages: {
              caregiverPathway: "Berikan maklumat tentang pesakit yang anda jaga.",
              patientPathway: "Maklumat peribadi anda akan digunakan sebagai maklumat pesakit.",

              nonBedriddenPatientPathway: "Berikan maklumat tentang penyakit kronik dan rawatan berterusan anda.",
              bedriddenPatientPathway: "Nyatakan sebab anda memohon tanpa penjaga yang layak.",

              medicalVerification: "JKM mungkin memerlukan pengesahan perubatan dan pengesahan mengenai aturan penjagaan pesakit.",
            },

            validation: {
              applicationPathwayRequired: "Sila pilih kategori permohonan.",

              patientNameRequired: "Sila berikan nama penuh pesakit.",
              patientRelationshipRequired: "Sila nyatakan hubungan pesakit dengan anda.",

              caregiverNameRequired: "Sila berikan nama penuh penjaga.",
              caregiverInformationRequired: "Sila lengkapkan maklumat penjaga.",

              differentIdentificationRequired: "Pesakit dan penjaga mestilah individu yang berbeza.",

              intensiveCareRequired: "Penjaga mesti mengesahkan bahawa penjagaan rapi diberikan.",
              bedriddenPatientRequired: "Kategori permohonan ini memerlukan pesakit yang terlantar.",

              nonBedriddenPatientRequired: "Kategori permohonan ini memerlukan pesakit yang tidak terlantar.",
              chronicIllnessRequired: "Sila sahkan penyakit kronik pesakit.",
              continuousTreatmentRequired: "Sila sahkan bahawa rawatan berterusan diperlukan.",
              treatmentStartDateRequired: "Sila berikan tarikh mula rawatan.",

              selfApplicationReasonRequired: "Sila nyatakan sebab permohonan sendiri.",
              inconsistentCaregiverInformation: "Sila semak maklumat penjaga dan sebab permohonan sendiri.",
            },
          },

          bwe: {
            title: "Bantuan Warga Emas",
            description: "Berikan maklumat tentang sokongan keluarga, keadaan kewangan dan pertimbangan khas.",

            sections: {
              familySupport: "Sokongan Keluarga dan Penjaga",
              incomeDeclaration: "Pengisytiharan Pendapatan",
              specialConsideration: "Pertimbangan Khas",
            },

            fields: {
              hasChildren: "Adakah anda mempunyai anak?",
              dependsOnFamilyOrCaregiver: "Adakah anda bergantung kepada ahli keluarga atau penjaga?",

              familyOrCaregiverMonthlyIncome: "Pendapatan Bulanan Keluarga atau Penjaga (RM)",
              incomeDeclarationDetails: "Butiran Tambahan Pengisytiharan Pendapatan",

              specialConsiderationRequested: "Adakah anda memohon pertimbangan khas daripada JKM?",
              specialConsiderationReason: "Sebab Pertimbangan Khas",
            },

            messages: {
              incomeDeclarationHelper: "Berikan maklumat pendapatan keluarga atau penjaga jika diketahui.",
              specialConsiderationHelper: "Terangkan sebarang keadaan yang anda ingin JKM pertimbangkan semasa menyemak permohonan anda.",
            },

            validation: {
              specialConsiderationRequired: "Sila nyatakan sama ada pertimbangan khas dipohon.",
              specialConsiderationReasonRequired: "Sila berikan sebab permohonan pertimbangan khas.",
            },
          },
        },
      },
    },

    eligibility: {
      questionnaire: {
        title: "Soal Selidik Kelayakan {{programCode}}",
        subtitle: "Beberapa maklumat tambahan akan membantu kami membuat penilaian awal kelayakan anda.",

        loading: "Sedang memuatkan soal selidik anda...",

        yourProgress: "Kemajuan Anda",
        reviewProgress: "Semakan Jawapan Anda",

        answeredCount: "{{answered}} daripada {{total}} telah dijawab",
        questionCount: "Soalan {{current}} daripada {{total}}",

        required: "Wajib",
        optional: "Pilihan",

        numberPlaceholder: "Masukkan nombor",
        amountPlaceholder: "Masukkan jumlah (RM)",
        countPlaceholder: "Masukkan nombor bulat",

        numberHint: "Masukkan nombor sah yang tidak negatif.",
        dateHint: "Gunakan format YYYY-MM-DD.",

        reviewTitle: "Semak Jawapan Anda",
        reviewDescription: "Sila semak jawapan anda sebelum menyimpan.",

        reviewAnswers: "Semak Jawapan",
        saveAnswers: "Simpan Jawapan",

        editAnswer: "Edit jawapan untuk {{question}}",

        noQuestions: "Tiada soalan tambahan diperlukan buat masa ini.",
        unknownSelection: "Pilihan tidak dikenali",

        disclaimer: "Jawapan anda hanya digunakan untuk penilaian awal kelayakan dan tidak menjamin kelulusan bantuan kerajaan.",

        validation: {
          boolean: "Sila pilih Ya atau Tidak.",
          select: "Sila pilih salah satu pilihan yang tersedia.",
          number: "Masukkan nombor yang sah.",
          nonNegative: "Nilai negatif tidak dibenarkan.",
          integer: "Masukkan nombor bulat.",
          decimalPlaces: "Masukkan tidak lebih daripada {{count}} tempat perpuluhan.",
          min: "Nilai minimum yang dibenarkan ialah {{min}}.",
          max: "Nilai maksimum yang dibenarkan ialah {{max}}.",
          date: "Masukkan tarikh yang sah dalam format YYYY-MM-DD.",
          futureDate: "Tarikh pada masa hadapan tidak dibenarkan.",
        },

        errors: {
          loadFailed: "Soal selidik anda tidak dapat dimuatkan. Sila cuba lagi.",
          saveFailed: "Jawapan anda tidak dapat disimpan. Sila cuba lagi.",
        },

        questions: {
          BAT: {
            bat_target_group: {
              label: "Adakah anda tergolong dalam kumpulan sasar JKM?",
              description: "Pilih status anda berdasarkan maklumat yang diketahui. JKM mungkin perlu mengesahkannya.",
            },

            bat_recommendation: {
              label: "Adakah anda mempunyai syor daripada pegawai perubatan atau JKM?",
            },

            bat_equipment: {
              label: "Adakah anda memohon alat bantuan?",
            },

            bat_equipment_cost: {
              label: "Berapakah anggaran kos alat bantuan tersebut (RM)?",
              description: "Masukkan anggaran kos jika diketahui. Anda boleh membiarkan soalan ini tanpa jawapan.",
            },
          },

          BPT: {
            bpt_role: {
              label: "Adakah anda memohon sebagai pesakit atau penjaga?",
              options: {
                patient: "Pesakit",
                caregiver: "Penjaga",
              },
            },

            bpt_patient_citizenship: {
              label: "Adakah pesakit warganegara Malaysia?",
            },

            bpt_patient_residence: {
              label: "Adakah pesakit kini menetap di Malaysia?",
            },

            bpt_patient_oku: {
              label: "Adakah pesakit seorang orang kurang upaya (OKU)?",
            },

            bpt_chronic_illness: {
              label: "Adakah pesakit menghidap penyakit kronik?",
            },

            bpt_bedridden: {
              label: "Adakah pesakit terlantar di katil?",
            },

            bpt_continuous_treatment: {
              label: "Adakah pesakit memerlukan rawatan berterusan?",
            },

            bpt_treatment_start: {
              label: "Bilakah rawatan berterusan bermula?",
            },

            bpt_has_caregiver: {
              label: "Adakah pesakit mempunyai penjaga?",
            },

            bpt_caregiver_citizenship: {
              label: "Adakah penjaga warganegara Malaysia?",
            },

            bpt_intensive_care: {
              label: "Adakah penjaga menyediakan penjagaan intensif?",
            },
          },
        },
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
