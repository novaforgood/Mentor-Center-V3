import type { StackScreenProps } from "@react-navigation/stack";
import { Box } from "../components/atomic/Box";
import { Button } from "../components/atomic/Button";
import { Text } from "../components/atomic/Text";
import { useAllProfilesOfUserQuery } from "../generated/graphql";
import { useUserData } from "../hooks/useUserData";
import type { RootStackParams } from "../types/navigation";

function HomeScreen({ navigation }: StackScreenProps<RootStackParams, "Home">) {
  const spaces = [{ spaceSlug: "test-space-1", spaceName: "Test Space 1" }];

  const { userData } = useUserData();
  const [{ data: profileData }] = useAllProfilesOfUserQuery({
    variables: { user_id: userData?.id ?? "" },
  });

  return (
    <Box>
      <Box>
        <Text variant="heading3">
          Welcome to Canopy Mobile, {userData?.first_name}!
        </Text>
        {profileData?.profile.map((profile) => {
          return (
            <Button
              onPress={() => {
                navigation.navigate("Directory", {
                  spaceSlug: profile.space.slug,
                });
              }}
            >
              {profile.space.name}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}

export default HomeScreen;