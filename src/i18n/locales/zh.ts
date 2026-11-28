const zh = {
  translation: {
    common: {
      back: "返回",
      continue: "继续",
      done: "完成",
      close: "关闭",
      cancel: "取消",
      ok: "确定",
      remove: "移除",
      complete: "完成",
      edit: "编辑",
      save: "保存",
      saving: "正在保存...",
      discard: "放弃",
      keepEditing: "继续编辑",

      retry: "重试",
      error: "发生错误",
      errorDescription: "无法加载此信息，请重试。",

      yes: "是",
      no: "否",
      notProvided: "未提供",

      selectDate: "选择日期",
      selectOption: "请选择",

      discardChanges: {
        title: "放弃更改？",
        message: "您有尚未保存的更改。如果现在离开，这些更改将会丢失。",
      },
    },

    language: {
      title: "语言",
      english: "English",
      malay: "Bahasa Melayu",
      chinese: "中文",
    },

    auth: {
      common: {
        backToLogin: "返回登录",
      },

      login: {
        title: "欢迎回来",
        subtitle: "登录以继续使用 BantuanKu。",
        email: "电子邮箱",
        emailPlaceholder: "请输入电子邮箱",
        password: "密码",
        passwordPlaceholder: "请输入密码",
        forgotPassword: "忘记密码？",
        signIn: "登录",
        noAccount: "还没有账号？",
        createAccount: "创建账号",
        unableToSignIn: "无法登录",

        errors: {
          invalidCredentials: "您输入的电子邮箱或密码不正确。",
          signInFailed: "无法登录，请重试。",
        },
      },

      forgotPassword: {
        title: "忘记密码？",
        subtitle: "请输入您的电子邮箱地址，我们将发送密码重置链接给您。",
        sentSubtitle: "请查看您的电子邮箱以继续重置密码。",

        sendResetLink: "发送重置链接",

        emailSent: "重置邮件已发送",
        emailSentDescription: "如果此电子邮箱已注册账户，密码重置链接将发送至该邮箱。请查看收件箱以继续。",

        unableToSend: "无法发送邮件",

        errors: {
          sendFailed: "无法发送密码重置邮件，请重试。",
        },
      },

      resetPassword: {
        title: "重置密码",
        subtitle: "请在下方输入您的新密码。",
        successSubtitle: "您的密码已成功更新。",

        newPassword: "新密码",
        newPasswordPlaceholder: "请输入新密码",

        confirmPassword: "确认新密码",
        confirmPasswordPlaceholder: "请再次输入新密码",

        resetPassword: "重置密码",

        success: "密码重置成功",
        successDescription:
            "您的密码已更新。现在您可以使用新密码登录。",

        unableToReset: "无法重置密码",

        errors: {
          resetFailed: "无法重置您的密码，请重试。",
        },
      },

      register: {
        registering: "正在创建您的账户...",
        registeringDescription: "请稍后，我们正在为您设置个人资料。",

        progress: {
          account: "账户",
          personal: "个人",
          residence: "住址",
          household: "家庭",
          documents: "文件",
        },

        account: {
          title: "创建账号",
          subtitle: "创建您的账号以开始使用。",

          email: "电子邮箱",
          emailPlaceholder: "请输入电子邮箱",

          password: "密码",
          passwordPlaceholder: "至少使用 8 个字符。",

          confirmPassword: "确认密码",
          confirmPasswordPlaceholder: "请再次输入密码",

          alreadyHaveAccount: "已有账号？",
          signIn: "登录",
        },

        personal: {
          title: "个人资料",
          subtitle: "请填写将接受援助推荐者的个人资料。",

          fullName: "姓名",
          fullNamePlaceholder: "请输入姓名",

          icNumber: "身份证号码",
          icNumberPlaceholder: "XXXXXX-XX-XXXX",

          dateOfBirth: "出生日期",
          dobFromIc: "会根据您的身份证号码自动填写。",

          citizenship: "国籍",
          selectCitizenship: "选择国籍",
          malaysian: "马来西亚公民",
          nonMalaysian: "非马来西亚公民",

          mobileNumber: "手机号码",
          mobilePlaceholder: "012-3456789",
        },

        residence: {
          title: "居住地址",
          subtitle: "请填写援助领取者目前的居住地址。",

          addressLine1: "地址第一行",
          addressLine1Placeholder: "门牌／单位号码及街道",

          addressLine2: "地址第二行",
          addressLine2Placeholder: "建筑、公寓或住宅区",

          postcode: "邮政编码",
          postcodePlaceholder: "例如：50000",

          city: "城市",
          cityPlaceholder: "例如：Kuala Lumpur",

          stateTerritory: "州属／联邦直辖区",
          selectStateTerritory: "选择州属或联邦直辖区",

          locationAutoHelper: "城市和州属将根据您的邮政编码自动填写。",
          locationManualHelper: "无法获取您的位置信息，请手动填写城市和州属。"
        },

        householdIncome: {
          title: "家庭与收入",
          subtitle: "请填写援助领取者的家庭及收入资料。",

          employmentStatus: "就业状态",
          selectEmploymentStatus: "选择就业状态",

          employmentStatusOptions: {
            employed: "受雇",
            selfEmployed: "自雇",
            unemployed: "失业",
            retired: "退休",
            homemaker: "家庭主妇／主夫",
            notWorking: "没有工作",
          },

          incomeSource: "收入来源",
          selectIncomeSource: "选择收入来源",

          incomeSourceOptions: {
            salary: "薪资",
            selfEmployment: "自雇收入",
            pension: "退休金",
            governmentAssistance: "政府援助",
            familySupport: "家庭资助",
            savings: "储蓄",
            other: "其他",
            noIncome: "无收入",
          },

          personalMonthlyIncome: "个人每月收入（RM）",
          householdMonthlyIncome: "家庭每月总收入（RM）",

          householdMembers: "家庭成员",
          householdMembersHelper:
              "添加与援助领取者居住在同一家庭的其他成员。",

          householdMember: "家庭成员 {{number}}",

          memberFullName: "姓名",
          memberFullNamePlaceholder: "输入家庭成员的姓名",

          relationship: "关系",
          selectRelationship: "选择关系",

          relationshipOptions: {
            spouse: "配偶",
            child: "子女",
            parent: "父母",
            sibling: "兄弟姐妹",
            grandchild: "孙子女",
            other: "其他",
          },

          memberDateOfBirth: "出生日期",

          addHouseholdMember: "添加家庭成员",
          removeHouseholdMember: "移除家庭成员",

          livingAloneHelper:
              "如果援助领取者独居，则无需添加家庭成员。",

          removeMemberDialog: {
            title: "移除家庭成员？",
            message: "为此家庭成员填写的资料将会被移除。",
          },
        },

        documents: {
          title: "辅助文件",
          subTitle: "上传您已有的文件，让日后的援助申请更加方便。",

          optional:
              "文件为选填项目。您可以稍后在个人资料中添加或更新文件。",

          identity: {
            title: "身份证明文件",
            description: "MyKad、MyPR 或其他身份证明文件",
          },

          income: {
            title: "收入证明文件",
            description: "工资单、雇主收入证明或收入声明",
          },

          address: {
            title: "地址证明",
            description: "显示您居住地址的水电费账单",
          },

          bank: {
            title: "银行账户证明",
            description: "银行结单或银行账户证明",
          },

          upload: "上传",
          addAnother: "继续添加",
          replace: "替换",

          fileRequirements: "PDF、JPG 或 PNG • 每个文件最大 10 MB",

          error: {
            title: "文件错误",
            invalidFileType: "请选择 PDF、JPG 或 PNG 文件。",
            fileTooLarge: "所选文件大小不得超过 10 MB。",
            selectionFailed: "无法选择此文件，请重试。",
          },
        },

        errors: {
          title: "无法完成注册。",
          incompleteRegistration: "部分注册资料尚未填写完整，请检查之前的步骤。",
          languageUnavailable: "无法确定您的首选语言。",
          registrationFailed: "无法完成注册，请重试。",
          identificationNumberExists: "此身份证号码已被注册。",
        },
      },
    },

    profile: {
      title: "个人资料",
      description: "管理您的个人及家庭资料。",

      sections: {
        personal: "个人",
        household: "家庭",
        residence: "住址",
        preferences: "偏好设置",
        account: "账户",
      },

      personalInformation: {
        title: "个人资料",
        description: "个人及人口资料",

        personalDetails: "个人资料",
        contact: "联系方式",

        fullName: "姓名",
        identificationNumber: "身份证号码",
        dateOfBirth: "出生日期",
        gender: "性别",
        citizenship: "国籍",
        mobileNumber: "手机号码",

        male: "男",
        female: "女",

        malaysian: "马来西亚公民",
        nonMalaysian: "非马来西亚公民",

        maritalStatus: "婚姻状况",
        homePhone: "住宅电话",

        personalCircumstances: "个人情况",
        financialInformation: "财务信息",
        studentStatus: "学生身份",
        okuStatus: "残障人士（OKU）身份",

        updateFailed: "无法更新您的手机号码，请重试。",
        updateCircumstancesFailed: "无法更新个人情况，请重试。",
        updateFinancialFailed: "无法更新财务信息，请重试。",
        updateHomePhoneFailed: "无法更新住宅电话号码，请重试。",
      },

      household: {
        title: "我的家庭",
        youOnly: "仅您一人",
        oneMember: "您 + 1 位家庭成员",
        multipleMembers: "您 + {{count}} 位家庭成员",

        members: "家庭成员",
        addMember: "添加家庭成员",
        editMember: "编辑家庭成员",
        completeInformation: "补充缺失资料",
        missingInformation: "缺少",
        moreFields: "另有 {{count}} 项",

        empty: {
          title: "暂无家庭成员",
          description: "添加与您居住在同一家庭的成员。",
        },

        loadError: {
          title: "无法加载家庭成员资料",
          description: "无法加载此家庭成员的资料，请重试。",
        },

        relationship: {
          spouse: "配偶",
          child: "子女",
          parent: "父母",
          sibling: "兄弟姐妹",
          grandchild: "孙子女 / 外孙子女",
          other: "其他",
        },

        member: {
          fullName: "姓名",
          relationship: "关系",
          dateOfBirth: "出生日期",
        },

        add: {
          selectRelationship: "选择关系",

          sections: {
            basicInformation: "基本资料",
            employmentIncome: "就业与教育",
            education: "教育",
            disability: "残障 / OKU",
          },

          fields: {
            citizenship: "国籍",
            identificationNumber: "身份证明号码",
            gender: "性别",
            isDependent: "此人在经济上是否依赖您？",
            employmentStatus: "就业状况",
            occupation: "职业",
            monthlyIncome: "每月收入（RM）",
            isStudent: "此人是否为学生？",
            studyMode: "学习模式",
            institutionType: "教育机构类型",
            isOku: "此人是否为残障人士（OKU）？",
            okuRegistered: "此人是否已注册为残障人士（OKU）？",
          },

          options: {
            male: "男",
            female: "女",

            malaysian: "马来西亚公民",
            nonMalaysian: "非马来西亚公民",

            employed: "受雇",
            selfEmployed: "自雇",
            unemployed: "失业",
            retired: "退休",
            homemaker: "家庭主妇／主夫",
            notWorking: "没有工作",

            fullTime: "全日制",
            partTime: "非全日制",

            school: "学校",
            ipta: "政府大学",
            ipts: "私立大学",
            other: "其他",
          },

          errorTitle: "无法添加家庭成员",
          errorDescription: "无法保存该家庭成员的资料，请重试。",
        },

        edit: {
          errorTitle: "无法更新家庭成员",
          errorDescription: "无法更新该家庭成员的资料，请重试。",
        },

        confirmation: {
          title: "家庭成员确认",
          description: "请检查您的家庭成员名单，并确认已列出所有家庭成员。如果您独自居住，也可以进行确认。确认后，您仍然可以添加或编辑家庭成员，但需要重新确认。",
          confirmed: "家庭成员信息已确认。",
          agreement: "我确认我的家庭成员资料完整且准确。",
          button: "确认家庭成员信息",
        },
      },

      incomeEmployment: {
        title: "收入与就业",
        noInformation: "就业资料",

        status: {
          employed: "受雇",
          selfEmployed: "自雇",
          unemployed: "失业",
          retired: "退休",
          notWorking: "没有工作",
        },
      },

      residentialAddress: {
        title: "居住地址",
        noAddress: "尚未提供地址",
        country: "国家",
      },

      language: {
        title: "语言",

        selectLanguageTitle: "选择语言",
        selectLanguageDescription: "选择您想使用的语言。"
      },

      account: {
        signOut: "退出登录",
        signOutDescription: "确定要退出当前账户吗？"
      },

      errors: {
        loadTitle: "无法加载个人资料",
        loadDescription: "无法加载您的个人资料。",
        tryAgain: "重试",
      },
    },

    applications: {
      title: "我的申请",
      description: "查看已提交的援助申请及其最新状态。",

      totalApplications: "申请总数",
      myApplications: "申请记录",

      status: "申请状态",
      lastUpdated: "最后更新",

      statuses: {
        draft: "草稿",
        inProgress: "填写中",
        readyForReview: "待确认",
        submitted: "已提交",
        underReview: "审核中",
        additionalInformationRequired: "需要补充资料",
        approved: "已批准",
        rejected: "未获批准",
        cancelled: "已取消",
      },

      submissionStates: {
        pending: "等待提交",
        failed: "提交失败",
        unknown: "提交状态未确认",
      },

      empty: {
        title: "暂无申请记录",
        description:
            "您尚未提交任何援助申请。提交申请后，您可以在这里查看申请状态。",
      },

      errors: {
        loadTitle: "无法加载申请记录",
        loadDescription:
            "无法获取您的申请记录。请检查网络连接后重试。",
      },

      buttons: {
        retrieveConfirmation: "获取提交确认",
      },

      eligibility: {
        title: "初步资格评估",

        status: "资格状态",
        criteriaVersion: "评估标准版本",
        assessedAt: "评估时间",

        statuses: {
          potentially_eligible: "可能符合资格",
          potentially_ineligible: "可能不符合资格",
          insufficient_information: "资料不足",
          manual_verification: "需要人工核实",
        },

        notAvailable: "此申请暂无初步资格评估结果。",
        notAssessed: "系统将在提交申请前进行初步资格评估。",

        disclaimer: "此初步资格评估由 BantuanKu 提供，并不代表 STR 的正式申请结果。",
      },

      str: {
        title: "STR 援助申请",
        description: "提交 STR 申请前，请先核对您的资料。",

        sections: {
          applicationDetails: "申请详情",
          applicantInformation: "申请人资料",
          applicationReadiness: "申请资料完整度",
          submissionConfirmation: "提交确认",
        },

        fields: {
          program: "援助计划",
          agency: "负责机构",
          applicationId: "申请编号",
          status: "申请状态",
          fullName: "姓名",
          identificationNo: "身份证号码",
          dateOfBirth: "出生日期",
          citizenship: "国籍",
          referenceNo: "参考编号",
          providerApplicationId: "STR 申请编号",
          providerStatus: "STR 状态",
          submittedAt: "提交时间",
        },

        readiness: {
          applicant: "申请人资料",
          address: "居住地址",
          household: "家庭资料",
          householdMembers: "家庭成员",
          complete: "已完成",
          incomplete: "未完成",
        },

        buttons: {
          submit: "提交 STR 申请",
          alreadySubmitted: "申请已提交",
          refresh: "刷新资料",
          cancel: "取消",
          confirm: "确认提交",
        },

        messages: {
          loading: "正在加载您的 STR 申请...",
          loadError: "无法加载您的 STR 申请，请重试。",
          notProvided: "未提供",
          notAvailable: "暂无资料",
          attentionRequired: "需要注意",
          missingInformation: "请先在个人资料中补充缺失信息，再提交申请。",
          confirmTitle: "提交 STR 申请？",
          confirmDescription: "提交 STR 申请前，请确认您所填写的资料准确无误。",
          successTitle: "申请已提交",
          successDescription: "您的 STR 申请已成功提交。参考编号：{{referenceNo}}",
          submissionError: "无法提交您的 STR 申请，请重试。",
          alreadySubmittedTitle: "申请已提交过",
          alreadySubmittedDescription: "您的 STR 申请已经提交，无需重复提交。",
          existingConfirmation: "这是您上一次提交申请的确认信息。",
          submissionUncertain: "无法确认 STR 是否已收到您的申请。请刷新并检查申请状态，再决定是否重试。",
          invalidConfirmation: "STR 服务返回了无效的提交确认。请检查您的申请状态。",
        },
      },

      jkm: {
        title: "{{programCode}} 援助申请",
        description: "请检查您的个人资料，并填写所需信息后提交 JKM 援助申请。",

        sections: {
          applicationDetails: "申请详情",
          applicantInformation: "申请人资料",
          applicationReadiness: "申请准备情况",
          programSpecificInformation: "援助项目专属资料",
          supportingDocuments: "证明文件",
          preliminaryEligibility: "初步资格评估",
          applicationReview: "申请资料确认",
          submissionConfirmation: "提交确认",
        },

        fields: {
          program: "援助项目",
          agency: "负责机构",
          applicationId: "申请编号",
          status: "申请状态",

          fullName: "姓名",
          identificationNo: "身份证号码",
          dateOfBirth: "出生日期",
          citizenship: "国籍",

          referenceNo: "参考编号",
          providerApplicationId: "JKM 申请编号",
          providerStatus: "JKM 申请状态",
          submittedAt: "提交时间",
        },

        readiness: {
          applicant: "申请人资料",
          address: "居住地址",
          household: "家庭资料",
          householdMembers: "家庭成员",
          programSpecificData: "援助项目专属资料",

          complete: "已完成",
          incomplete: "未完成",
          notRequired: "无需填写",
        },

        buttons: {
          submit: "提交 JKM 申请",
          alreadySubmitted: "申请已提交",
          refresh: "刷新资料",
          saveDraft: "保存草稿",
          review: "检查申请资料",
          checkSubmission: "查询提交状态",
          confirm: "确认提交",
          submitting: "正在提交...",
        },

        messages: {
          loading: "正在加载您的 JKM 申请...",
          loadError: "无法加载您的 JKM 申请，请重试。",

          notAvailable: "暂无资料",

          attentionRequired: "需要注意",
          missingInformation: "请先完善个人资料中缺失的信息，再提交申请。",
          incompleteApplication: "请填写所需的申请资料后再提交。",

          draftSaved: "您的申请草稿已保存。",
          draftSaveError: "无法保存您的申请草稿，请重试。",

          reviewDescription: "请在提交申请前检查您的资料及申报内容。",

          confirmTitle: "提交 JKM 申请？",
          confirmDescription: "请确认您的资料及申报内容准确无误，再向 JKM 提交申请。",

          declaration: "本人确认本申请所提供的资料完整且准确。",

          successTitle: "申请提交成功",
          successDescription: "您的 JKM 申请已成功提交。参考编号：{{referenceNo}}",

          submissionError: "无法提交 JKM 申请。",
          submissionUncertain: "暂时无法确认 JKM 申请是否已成功提交，请先查询申请状态后再重试。",
          invalidConfirmation: "JKM 服务返回了无效的提交确认信息，请查询您的申请状态。",

          invalidProgram: "不支持此 JKM 援助项目。",
          invalidSubmissionState: "无效的 JKM 外部提交状态。",

          alreadySubmittedTitle: "申请已提交",
          alreadySubmittedDescription: "您的 JKM 申请已提交，无需重复提交。",
          existingConfirmation: "这是您之前提交申请时收到的确认信息。",

          pendingTitle: "申请正在提交",
          pendingDescription: "您的申请正在处理中，请先查询提交状态后再重试。",

          unknownTitle: "提交状态未知",
          unknownDescription: "目前无法确认 JKM 是否已收到您的申请。在提交状态得到确认之前，您无法修改申请资料。",

          failedTitle: "申请提交失败",
          failedDescription: "您的申请未能成功提交，请检查申请资料后再重试。",

          applicationLocked: "此申请正在提交、尚未确认提交状态或已完成提交，因此暂时无法修改。",

          eligibilityDisclaimer: "初步资格评估结果并不代表 JKM 已批准您的申请。JKM 可能要求您提供额外资料或进行进一步核实。",
          simulationDisclaimer: "此申请仅提交至模拟 JKM 服务，用于演示目的。",
        },

        form: {
          required: "必填",
          optional: "选填",

          textPlaceholder: "请输入详细资料",
          amountPlaceholder: "请输入金额（RM）",
          countPlaceholder: "请输入整数",

          validation: {
            required: "此项为必填项。",
            boolean: "请选择是或否。",
            select: "请选择有效选项。",
            number: "请输入有效数字。",
            nonNegative: "不允许输入负数。",
            integer: "请输入整数。",
            date: "请输入有效日期。",
            identificationNo: "请输入有效的身份证明号码。",
            maxLength: "输入内容不得超过 {{count}} 个字符。",
            declarationRequired: "请在提交申请前确认您的申报内容。",
          },
        },

        options: {
          citizenship: {
            malaysian: "马来西亚公民",
            nonMalaysian: "非马来西亚公民",
          },

          relationship: {
            spouse: "配偶",
            child: "子女",
            parent: "父母",
            sibling: "兄弟姐妹",
            grandchild: "孙子女",
            other: "其他",
          },
        },

        health: {
          title: "健康资料",

          isOku: "此人是否为残障人士（OKU）？",
          okuRegistered: "此人是否已注册为残障人士（OKU）？",
          disabilityDescription: "残障情况说明",

          hasChronicIllness: "此人是否患有慢性疾病？",
          chronicIllnessDetails: "慢性疾病详情",

          isBedridden: "此人是否卧床不起？",
          requiresContinuousTreatment: "此人是否需要持续治疗？",
          treatmentStartDate: "治疗开始日期",
        },

        programs: {
          ba: {
            title: "一般援助（Bantuan Am）",
            description: "请提供您目前领取的福利援助及其他特殊情况的资料。",

            sections: {
              welfareAssistance: "现有福利援助",
              additionalCircumstances: "其他特殊情况",
            },

            fields: {
              receivesOtherJkmMonthlyAssistance: "您目前是否正在领取 JKM 提供的其他每月援助？",
              currentJkmAssistanceProgram: "目前领取的 JKM 援助项目",

              economicHardship: "您是否面临经济困难？",
              healthRelatedNeeds: "您是否有额外的健康相关需求？",
              dependentRelatedNeeds: "您是否有与受抚养人相关的额外需求？",
              otherCircumstances: "是否有其他需要 JKM 考虑的特殊情况？",

              description: "其他特殊情况说明",
            },

            validation: {
              currentProgramRequired: "请输入您目前领取的 JKM 援助项目名称。",
              inconsistentAssistance: "请检查您所申报的现有 JKM 援助资料。",
              circumstancesDescriptionRequired: "请说明其他特殊情况。",
            },
          },

          bat: {
            title: "义肢及辅助器具援助（Bantuan Alat Tiruan / Alat Sokongan）",
            description: "请提供受益人、所申请的辅助器具及相关推荐资料。",

            sections: {
              beneficiary: "受益人资料",
              beneficiaryHealth: "受益人健康资料",
              functionalLimitations: "身体功能受限情况",
              equipment: "辅助器具资料",
              recommendation: "推荐资料",
              additionalJustification: "额外申请理由",
            },

            fields: {
              beneficiaryType: "谁将使用所申请的辅助器具？",
              fullName: "受益人姓名",
              identificationNo: "受益人身份证明号码",
              relationshipToApplicant: "与申请人的关系",

              functionalLimitationDescription: "请说明受益人的身体功能受限情况。",

              equipmentType: "辅助器具类型",
              equipmentDescription: "辅助器具说明",
              purpose: "辅助器具用途",
              estimatedCost: "预计器具费用（RM）",
              supplierName: "供应商名称",
              quotationAvailable: "是否已有辅助器具报价单？",

              recommendationAvailable: "是否已有相关推荐证明？",
              recommendingAuthority: "推荐方",
              recommendationOfficerName: "推荐人员姓名",
              recommendationInstitution: "推荐机构",
              recommendationDetails: "推荐详情",

              additionalJustification: "辅助器具额外申请理由",
            },

            options: {
              beneficiaryType: {
                applicant: "本人",
                dependent: "我的受抚养人",
              },

              recommendingAuthority: {
                medicalOfficer: "医务人员",
                jkmOfficer: "JKM 官员",
                other: "其他",
              },
            },

            messages: {
              applicantBeneficiary: "您的个人资料及健康资料将作为受益人的资料使用。",
              dependentBeneficiary: "请提供受抚养人的资料。您的个人健康资料不会用于该受益人。",

              highCostEquipment: "费用超过 RM20,000 的辅助器具需要提供额外申请理由。",
              recommendationVerification: "JKM 可能需要核实推荐资料及所申请的辅助器具。",
            },

            validation: {
              beneficiaryTypeRequired: "请选择受益人类型。",
              beneficiaryNameRequired: "请输入受益人的姓名。",
              beneficiaryRelationshipRequired: "请注明受益人与您的关系。",
              dependentIdentificationConflict: "受抚养人的身份证明号码不得与申请人的身份证明号码相同。",

              equipmentTypeRequired: "请注明辅助器具类型。",
              equipmentDescriptionRequired: "请说明所申请的辅助器具。",
              equipmentPurposeRequired: "请说明所申请辅助器具的用途。",

              recommendingAuthorityRequired: "请注明推荐方。",
              recommendationDetailsRequired: "请提供推荐方的详细资料。",
              additionalJustificationRequired: "费用超过 RM20,000 的辅助器具必须提供额外申请理由。",
            },
          },

          bpt: {
            title: "护理援助（Bantuan Penjagaan）",
            description: "请提供患者、照护者及医疗证明的相关资料。",

            sections: {
              applicationPathway: "申请类别",
              patient: "患者资料",
              patientHealth: "患者健康资料",
              caregiver: "照护者资料",
              medicalConfirmation: "医疗证明",
              additionalInformation: "补充资料",
            },

            fields: {
              applicationPathway: "您将以哪种身份申请此项援助？",

              patient: {
                fullName: "患者姓名",
                identificationNo: "患者身份证明号码",
                citizenship: "患者国籍",
                relationshipToApplicant: "患者与申请人的关系",
              },

              caregiver: {
                fullName: "照护者姓名",
                identificationNo: "照护者身份证明号码",
                citizenship: "照护者国籍",
                relationship: "与患者的关系",
                providesIntensiveCare: "照护者是否提供密集护理？",
                eligiblePersonsCaredFor: "接受护理的符合资格人数",
              },

              medicalConfirmation: {
                medicalConfirmationAvailable: "是否已有医疗证明？",
                medicalInstitution: "医疗机构",
                medicalOfficerName: "医务人员姓名",
                diagnosisDetails: "诊断详情",
                treatmentDetails: "治疗详情",
                specialistDetails: "专科医生资料",
              },

              reasonForSelfApplication: "自行申请的原因",
              additionalRemarks: "补充说明",
            },

            options: {
              applicationPathway: {
                caregiver: "以照护者身份申请",
                nonBedriddenPatient: "以非卧床慢性疾病患者身份申请",
                bedriddenPatientWithoutEligibleCaregiver: "以没有符合资格照护者的卧床患者身份申请",
              },

              reasonForSelfApplication: {
                noCaregiver: "没有照护者",
                nonMalaysianCaregiver: "照护者并非马来西亚公民",
              },
            },

            messages: {
              caregiverPathway: "请提供您所照护患者的资料。",
              patientPathway: "您的个人资料将作为患者的资料使用。",

              nonBedriddenPatientPathway: "请提供您的慢性疾病及持续治疗资料。",
              bedriddenPatientPathway: "请说明您在没有符合资格照护者的情况下自行申请的原因。",

              medicalVerification: "JKM 可能要求提供医疗证明，并核实患者的护理安排。",
            },

            validation: {
              applicationPathwayRequired: "请选择申请类别。",

              patientNameRequired: "请输入患者姓名。",
              patientRelationshipRequired: "请注明患者与您的关系。",

              caregiverNameRequired: "请输入照护者姓名。",
              caregiverInformationRequired: "请完善照护者资料。",

              differentIdentificationRequired: "患者与照护者必须为不同人士。",

              intensiveCareRequired: "照护者必须确认已提供密集护理。",
              bedriddenPatientRequired: "此申请类别要求患者处于卧床状态。",

              nonBedriddenPatientRequired: "此申请类别要求患者处于非卧床状态。",
              chronicIllnessRequired: "请确认患者患有慢性疾病。",
              continuousTreatmentRequired: "请确认患者需要持续治疗。",
              treatmentStartDateRequired: "请提供治疗开始日期。",

              selfApplicationReasonRequired: "请注明自行申请的原因。",
              inconsistentCaregiverInformation: "请检查照护者资料及自行申请的原因。",
            },
          },

          bwe: {
            title: "乐龄人士援助（Bantuan Warga Emas）",
            description: "请提供家庭支持、经济状况及特殊考虑事项的相关资料。",

            sections: {
              familySupport: "家庭及照护者支持",
              incomeDeclaration: "收入申报",
              specialConsideration: "特殊考虑",
            },

            fields: {
              hasChildren: "您是否有子女？",
              dependsOnFamilyOrCaregiver: "您是否依赖家庭成员或照护者的支持？",

              familyOrCaregiverMonthlyIncome: "家庭成员或照护者每月收入（RM）",
              incomeDeclarationDetails: "额外收入申报详情",

              specialConsiderationRequested: "您是否希望 JKM 给予特殊考虑？",
              specialConsiderationReason: "申请特殊考虑的原因",
            },

            messages: {
              incomeDeclarationHelper: "如您知晓家庭成员或照护者的收入，请提供相关资料。",
              specialConsiderationHelper: "请说明您希望 JKM 在审核申请时考虑的特殊情况。",
            },

            validation: {
              specialConsiderationRequired: "请注明是否申请特殊考虑。",
              specialConsiderationReasonRequired: "请提供申请特殊考虑的原因。",
            },
          },
        },
      },
    },

    eligibility: {
      questionnaire: {
        title: "{{programCode}} 资格评估问卷",
        subtitle: "请提供一些补充资料，以便我们初步评估您是否符合援助资格。",

        loading: "正在加载资格评估问卷...",

        yourProgress: "填写进度",
        reviewProgress: "查看填写进度",

        answeredCount: "已回答 {{answered}} / {{total}} 题",
        questionCount: "第 {{current}} 题，共 {{total}} 题",

        required: "必填",
        optional: "选填",

        numberPlaceholder: "请输入数字",
        amountPlaceholder: "请输入金额（RM）",
        countPlaceholder: "请输入整数",

        numberHint: "请输入有效的非负数。",
        dateHint: "请使用 YYYY-MM-DD 格式。",

        reviewTitle: "检查您的答案",
        reviewDescription: "保存前，请检查您填写的答案。",

        reviewAnswers: "检查答案",
        saveAnswers: "保存答案",

        editAnswer: "编辑以下问题的答案：{{question}}",

        noQuestions: "目前无需回答其他问题。",
        unknownSelection: "无法识别所选选项",

        disclaimer: "您的答案仅用于初步资格评估，并不保证政府援助申请一定获得批准。",

        validation: {
          boolean: "请选择是或否。",
          select: "请选择其中一个可用选项。",
          number: "请输入有效的数字。",
          nonNegative: "不允许输入负数。",
          integer: "请输入整数。",
          decimalPlaces: "小数位数不得超过 {{count}} 位。",
          min: "允许输入的最小值为 {{min}}。",
          max: "允许输入的最大值为 {{max}}。",
          date: "请输入有效日期，格式为 YYYY-MM-DD。",
          futureDate: "不能选择未来的日期。",
        },

        errors: {
          loadFailed: "无法加载资格评估问卷，请重试。",
          saveFailed: "无法保存您的答案，请重试。",
        },

        questions: {
          BAT: {
            bat_target_group: {
              label: "您是否属于社会福利局（JKM）的援助目标群体？",
              description: "请根据您目前所知的情况选择。JKM 可能需要进一步核实。",
            },

            bat_recommendation: {
              label: "您是否获得医疗专业人员或社会福利局（JKM）的推荐？",
            },

            bat_equipment: {
              label: "您是否正在申请辅助器具？",
            },

            bat_equipment_cost: {
              label: "所需辅助器具的预计费用是多少（RM）？",
              description: "如果知道大概费用，请输入估计金额。您也可以留空。",
            },
          },

          BPT: {
            bpt_role: {
              label: "您是以患者还是照顾者的身份提出申请？",
              options: {
                patient: "患者",
                caregiver: "照顾者",
              },
            },

            bpt_patient_citizenship: {
              label: "患者是否为马来西亚公民？",
            },

            bpt_patient_residence: {
              label: "患者目前是否居住在马来西亚？",
            },

            bpt_patient_oku: {
              label: "患者是否为残障人士（OKU）？",
            },

            bpt_chronic_illness: {
              label: "患者是否患有慢性疾病？",
            },

            bpt_bedridden: {
              label: "患者是否长期卧床？",
            },

            bpt_continuous_treatment: {
              label: "患者是否需要持续接受治疗？",
            },

            bpt_treatment_start: {
              label: "患者从什么时候开始接受持续治疗？",
            },

            bpt_has_caregiver: {
              label: "患者是否有照顾者？",
            },

            bpt_caregiver_citizenship: {
              label: "照顾者是否为马来西亚公民？",
            },

            bpt_intensive_care: {
              label: "照顾者是否提供密集照护？",
            },
          },
        },
      },
    },

    validation: {
      required: "此项为必填项。",

      emailRequired: "请输入电子邮箱。",
      emailInvalid: "请输入有效的电子邮箱地址。",

      passwordRequired: "请输入密码。",
      passwordTooShort: "密码必须至少包含 8 个字符。",

      confirmPasswordRequired: "请确认密码。",
      passwordMismatch: "两次输入的密码不一致。",

      fullNameRequired: "请输入姓名。",

      myKadNumberRequired: "请输入身份证号码。",
      myKadNumberInvalid: "请输入有效的身份证号码。",

      dateOfBirthRequired: "请选择出生日期。",
      dateOfBirthInvalid: "请输入有效的出生日期。",
      dateOfBirthMismatch: "出生日期与身份证号码不一致。",

      citizenshipRequired: "请选择国籍。",

      mobileNumberRequired: "请输入手机号码。",
      mobileNumberInvalid: "请输入有效的马来西亚手机号码。",

      addressLine1Required: "请输入地址第一行。",

      postcodeRequired: "请输入邮政编码。",
      postcodeInvalid: "请输入有效的 5 位数邮政编码。",

      cityRequired: "请输入城市。",
      stateTerritoryRequired: "请选择州属或联邦直辖区。",

      employmentStatusRequired: "请选择就业状态。",

      incomeSourceRequired: "请选择收入来源。",
      personalMonthlyIncomeRequired: "请输入个人每月收入。",
      householdMonthlyIncomeRequired: "请输入家庭每月总收入。",
      monthlyIncomeInvalid: "请输入有效的每月收入。",

      householdMemberNameRequired: "请输入家庭成员姓名。",
      relationshipRequired: "请选择与援助领取者的关系。",

      householdMemberDobRequired: "请输入家庭成员的出生日期。",

      identificationNumberInvalid: "请输入有效的身份证明号码。",
    },
  },
};

export default zh;
