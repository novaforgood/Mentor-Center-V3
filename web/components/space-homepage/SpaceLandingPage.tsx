import { createFactory, ImgHTMLAttributes, useState } from "react";

import { useRouter } from "next/router";

import { useProfileListingsInSpaceQuery } from "../../generated/graphql";
import { useCurrentSpace } from "../../hooks/useCurrentSpace";
import { useUserData } from "../../hooks/useUserData";
import { Text } from "../atomic";
import { SelectAutocomplete } from "../atomic/SelectAutocomplete";
import { HtmlDisplay } from "../HtmlDisplay";
import { ProfileCard } from "../ProfileCard";
import { SpaceCoverPhoto } from "../SpaceCoverPhoto";

import { SearchBar } from "./SearchBar";

function SpaceSplashPage() {
  const { currentSpace } = useCurrentSpace();

  return (
    <div className="flex items-center gap-8">
      <div className="flex flex-col flex-1">
        <Text variant="heading1">{currentSpace?.name}</Text>
        <div className="h-8"></div>
        <HtmlDisplay html={currentSpace?.description_html ?? ""} />
      </div>
      <div className="flex-1 self-stretch">
        <SpaceCoverPhoto
          className="h-full w-full bg-gray-50"
          src={currentSpace?.space_cover_image?.image.url}
        ></SpaceCoverPhoto>
      </div>
    </div>
  );
}

interface FilterBarProps {
  selectedTagIds: Set<string>;
  onChange: (newTagIds: Set<string>) => void;
}
function FilterBar(props: FilterBarProps) {
  const { selectedTagIds, onChange } = props;

  const { currentSpace } = useCurrentSpace();

  return (
    <div className="flex">
      {currentSpace?.space_tag_categories.map((category) => {
        return (
          <SelectAutocomplete
            key={category.id}
            options={category.space_tags.map((tag) => ({
              value: tag.id,
              label: tag.label,
            }))}
            value={null}
            onSelect={(newTagId) => {
              if (newTagId)
                onChange(new Set([...Array.from(selectedTagIds), newTagId]));
            }}
          />
        );
      })}
    </div>
  );
}

export function SpaceLandingPage() {
  const { currentSpace } = useCurrentSpace();

  const router = useRouter();

  const [{ data: profileListingData }] = useProfileListingsInSpaceQuery({
    variables: {
      where: {
        profile: { space_id: { _eq: currentSpace?.id } },
        public: { _eq: true },
      },
    },
  });

  const allProfileListings = profileListingData?.profile_listing ?? [];

  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  return (
    <div>
      <div className="h-16"></div>
      <SpaceSplashPage />
      <FilterBar selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />
      <div className="h-16"></div>
      <div className="h-8"></div>
      <div className="grid grid-cols-4 gap-4">
        {allProfileListings.map((listing, idx) => {
          const { first_name, last_name } = listing.profile.user;

          const tagNames =
            listing.profile_listing_to_space_tags?.map(
              (tag) => tag.space_tag.label
            ) ?? [];
          return (
            <ProfileCard
              key={idx}
              onClick={() => {
                router.push(`${router.asPath}/profile/${listing.profile.id}`);
              }}
              name={`${first_name} ${last_name}`}
              imageUrl={listing.profile_listing_image?.image.url}
              subtitle={listing.headline}
              descriptionTitle={"Topics"}
              description={tagNames.join(", ")}
            />
          );
        })}
      </div>
    </div>
  );
}
