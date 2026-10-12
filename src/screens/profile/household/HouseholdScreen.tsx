import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../../types/tabNavigator";
import { getHouseholdMembers, HouseholdMemberSummary } from "../../../services/profile/householdService";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ChevronRight, UsersRound } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useCallback, useState } from "react";

import Screen from "../../../components/layout/Screen";
import ScreenHeader from "../../../components/layout/ScreenHeader";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Section from "../../../components/layout/Section";
import {useFocusEffect} from "@react-navigation/native";

type HouseholdScreenProps = NativeStackScreenProps<ProfileStackParamList, "Household">;

type HouseholdMemberRowProps = {
  member: HouseholdMemberSummary;
  relationship: string;
  dateOfBirth: string;
  onPress: () => void;
  showDivider?: boolean;
};

function HouseholdMemberRow({
    member,
    relationship,
    dateOfBirth,
    onPress,
    showDivider = true
}: HouseholdMemberRowProps) {
  return (
      <View>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          className="flex-row items-center py-4"
        >
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/20">
            <Text className="text-base font-semibold text-primary">
              {member.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View className="ml-3 flex-1">
            <Text className="text-base font-medium text-foreground">
              {member.fullName}
            </Text>

            <Text className="mt-0.5 text-sm text-muted-foreground">
              {relationship}
            </Text>

            <Text className="mt-0.5 text-sm text-muted-foreground">
              {dateOfBirth}
            </Text>
          </View>

          <ChevronRight size={20} color="#9CA3AF" />
        </Pressable>

        {showDivider && (
            <View className="h-px bg-border" />
        )}
      </View>
  );
}

export default function HouseholdScreen({
    navigation
}: HouseholdScreenProps) {
  const { t } = useTranslation();

  const [householdMembers, setHouseholdMembers] = useState<HouseholdMemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadHouseholdMembers =
      useCallback(async () => {
        try {
          setLoading(true);
          setError(false);

          const data = await getHouseholdMembers();

          setHouseholdMembers(data);
        } catch (loadError) {
          if (__DEV__) {
            console.error(
                "[PROFILE] Failed to load household members:", loadError
            );
          }

          setError(true);
        } finally {
          setLoading(false);
        }
      }, []);

  useFocusEffect(
      useCallback(() => {
        void loadHouseholdMembers();
      }, [loadHouseholdMembers])
  );

  const formatDateOfBirth = (
      dateOfBirth: string | null
  ) => {
    if (!dateOfBirth) {
      return t("profile.household.notProvided");
    }

    const [year, month, day] = dateOfBirth.split("-");

    if (!year || !month || !day) {
      return dateOfBirth;
    }

    return `${day}/${month}/${year}`;
  };

  const getRelationshipLabel = (
      relationship: string
  )=> {
    const relationshipKeys: Record<string, string> = {
      spouse: "spouse",
      child: "child",
      parent: "parent",
      sibling: "sibling",
      grandchild: "grandchild",
      other: "other"
    };

    const relationshipKey = relationshipKeys[relationship];

    if (!relationshipKey) {
      return relationship;
    }

    return t(`profile.household.relationship.${relationshipKey}`);
  };

  if (loading) {
    return (
        <Screen scroll={false}>
          <ScreenHeader
              title={t("profile.household.title")}
              onBack={() => navigation.goBack()}
          />

          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0352CE" />
          </View>
        </Screen>
    );
  }

  if (error) {
    return (
        <Screen scroll={false}>
          <ScreenHeader
            title={t("profile.household.title")}
            onBack={() => navigation.goBack()}
          />

          <View className="flex-1 items-center justify-center">
            <Text className="text-center text-base font-semibold text-foreground">
              {t("profile.errors.loadTitle")}
            </Text>

            <Text className="mt-2 text-center text-sm leading-5 text-muted-foreground">
              {t("profile.errors.loadDescription")}
            </Text>

            <View className="mt-5">
              <Button onPress={() => void loadHouseholdMembers()}>
                {t("profile.errors.tryAgain")}
              </Button>
            </View>
          </View>
        </Screen>
    );
  }

  return (
      <Screen>
        <ScreenHeader
            title={t("profile.household.title")}
            onBack={() => navigation.goBack()}
            className="mb-8"
        />

        {householdMembers.length === 0 ? (
            <Card>
              <View className="items-center py-6">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/20">
                  <UsersRound size={26} color="#0352CE" />
                </View>

                <Text className="mt-4 text-center text-base font-semibold text-foreground">
                  {t("profile.household.empty.title")}
                </Text>

                <Text className="mt-2 text-center text-sm leading-5 text-muted-foreground">
                  {t("profile.household.empty.description")}
                </Text>

                <View className="mt-5">
                  <Button onPress={() => navigation.navigate("AddHouseholdMember")}>
                    {t("profile.household.addMember")}
                  </Button>
                </View>
              </View>
            </Card>
        ) : (
            <View className="gap-8">
              <Section title={t("profile.household.members")}>
                <Card>
                  {householdMembers.map((member, index) => (
                      <HouseholdMemberRow
                          key={member.id}
                          member={member}
                          relationship={getRelationshipLabel(member.relationship)}
                          dateOfBirth={formatDateOfBirth(member.dateOfBirth)}
                          onPress={() =>
                            navigation.navigate(
                                "HouseholdMember",
                                {
                                  memberId: member.id
                                }
                            )
                          }
                          showDivider={index < householdMembers.length - 1}
                      />
                  ))}
                </Card>
              </Section>

              <Button
                variant="outline"
                onPress={() => navigation.navigate("AddHouseholdMember")}
              >
                {t("profile.household.addMember")}
              </Button>
            </View>
        )}
      </Screen>
  );
}
