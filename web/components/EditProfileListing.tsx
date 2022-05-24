import { useDisclosure } from "@mantine/hooks";

import { Profile_Role_Enum, useProfileImageQuery } from "../generated/graphql";
import { BxsPencil } from "../generated/icons/solid";
import { useCurrentProfile } from "../hooks/useCurrentProfile";
import { useCurrentSpace } from "../hooks/useCurrentSpace";

import { Button, Text } from "./atomic";
import { EditResponse } from "./edit-profile/EditResponse";
import { ProfileSocialsDisplay } from "./edit-socials-info/ProfileSocialsDisplay";
import { ProfileSocialsModal } from "./edit-socials-info/ProfileSocialsModal";
import { EditButton } from "./EditButton";

export function EditProfileListing() {
  const { currentProfile, currentProfileHasRole } = useCurrentProfile();
  const { currentSpace } = useCurrentSpace();

  const [{ data: profileImageData }] = useProfileImageQuery({
    variables: { profile_id: currentProfile?.id ?? "" },
  });

  const [socialsOpened, socialsHandlers] = useDisclosure(false);

  if (!currentProfileHasRole(Profile_Role_Enum.MemberWhoCanList)) {
    return <div>You do not have profile listing permissions.</div>;
  }
  if (!currentProfile || !currentSpace) {
    return <div>Either profile or space is null</div>;
  }

  const { first_name, last_name, email, id } = currentProfile.user;
  const profileImageUrl =
    profileImageData?.profile_listing_image[0]?.image.url ?? null;

  return (
    <div className="">
      <div className="max-w-3xl border border-black rounded-lg w-full flex flex-col pb-12">
        <div className="h-20 bg-gray-100 rounded-t-lg"></div>
        <div className="px-12 -mt-4">
          <div className="flex items-center gap-12">
            <div
              className="rounded-full h-40 w-40 bg-gray-400 border border-gray-500"
              style={{
                backgroundImage: `url(${profileImageUrl})`,
                backgroundSize: "cover",
              }}
            ></div>
            <div className="flex flex-col mt-4">
              <Text variant="heading4">
                {first_name} {last_name}
              </Text>
              <div className="h-1"></div>
              <Text variant="body1">
                Hello! This is my profile summary or bio.
              </Text>
            </div>
          </div>
          <div className="h-16"></div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              {currentSpace.space_listing_questions.map((question) => {
                return <EditResponse key={question.id} question={question} />;
              })}
            </div>
            <div>
              <div className="h-24 bg-gray-50 p-4 rounded-md">Tags go here</div>
              <div className="h-8"></div>
              <div className="bg-gray-50 p-4 rounded-md">
                <Text variant="subheading1">
                  Contact me
                  <EditButton
                    className="mb-1 ml-1"
                    onClick={socialsHandlers.open}
                  />
                </Text>
                <div className="h-4"></div>
                <Text>Need some help? {"We'll"} introduce you.</Text>
                <div className="h-4"></div>
                <Button disabled rounded>
                  Introduce me
                </Button>
                <div className="h-8"></div>
                <ProfileSocialsDisplay />
                <ProfileSocialsModal
                  isOpen={socialsOpened}
                  onClose={socialsHandlers.close}
                />

                <div className="flex"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}