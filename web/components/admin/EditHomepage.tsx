import { useEffect, useRef, useState } from "react";
import AvatarEditor from "react-avatar-editor";
import toast from "react-hot-toast";
import { Button, Text } from "../atomic";
import { ImageUploader } from "../ImageUploader";
import { SimpleRichTextInput } from "../inputs/SimpleRichTextInput";
import { TextInput } from "../inputs/TextInput";
import {
  useUpdateSpaceMutation,
  useUpsertSpaceCoverImageMutation,
} from "../../generated/graphql";
import { BxsCloudUpload } from "../../generated/icons/solid";
import { useCurrentSpace } from "../../hooks/useCurrentSpace";
import { uploadImage } from "../../lib/image";

export function EditHomepage() {
  const { currentSpace } = useCurrentSpace();

  const [spaceName, setSpaceName] = useState("");
  const [spaceDescriptionHtml, setSpaceDescriptionHtml] = useState("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (currentSpace) {
      setSpaceName(currentSpace.name);
      setImageSrc(currentSpace.space_cover_image?.image.url ?? null);
    }
  }, [currentSpace]);

  const editor = useRef<AvatarEditor | null>(null);

  const [edited, setEdited] = useState(false);
  const [editedCoverPhoto, setEditedCoverPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [_, updateSpace] = useUpdateSpaceMutation();
  const [__, upsertCoverImage] = useUpsertSpaceCoverImageMutation();

  return (
    <div className="flex flex-col items-start">
      <Button
        disabled={!edited && !editedCoverPhoto}
        rounded
        onClick={async () => {
          if (!currentSpace) {
            toast.error("No space");
            return;
          }
          setLoading(true);

          const imageData =
            editor.current?.getImageScaledToCanvas().toDataURL() ?? null;

          if (imageData && editedCoverPhoto) {
            const res = await uploadImage(imageData).catch((err) => {
              toast.error(err.message);
              return null;
            });
            if (!res) {
              setLoading(false);
              toast.error("Image failed to upload");
              return;
            }

            const image = res.data.image;

            const res2 = await upsertCoverImage({
              image_id: image.id,
              space_id: currentSpace.id,
            }).catch((err) => {
              toast.error(err.message);
              return null;
            });
            if (!res2) {
              setLoading(false);
              toast.error("Upsert cover image failed");
              return;
            }
          }

          updateSpace({
            variables: {
              name: spaceName,
              description_html: spaceDescriptionHtml,
            },
            space_id: currentSpace.id,
          })
            .then(() => {
              setEdited(false);
              toast.success("Saved settings");
            })
            .finally(() => {
              setLoading(false);
            });
        }}
        loading={loading}
      >
        Save changes
      </Button>

      <div className="h-16"></div>
      <Text variant="subheading1" bold>
        Space name
      </Text>
      <div className="h-2"></div>
      <div className="w-96">
        <TextInput
          value={spaceName}
          onValueChange={(newValue) => {
            setEdited(true);
            setSpaceName(newValue);
          }}
        ></TextInput>
      </div>

      <div className="h-8"></div>

      <Text variant="subheading1" bold>
        Space description
      </Text>
      <div className="h-2"></div>
      <div className="w-96">
        <SimpleRichTextInput
          initContent={currentSpace?.description_html ?? undefined}
          characterLimit={300}
          onUpdate={({ editor }) => {
            setEdited(true);
            setSpaceDescriptionHtml(editor.getHTML());
          }}
        />
      </div>

      <div className="h-8"></div>

      <Text variant="subheading1" bold>
        Cover image {editedCoverPhoto && "(edited)"}
      </Text>
      <div className="h-2"></div>
      <ImageUploader
        imageSrc={imageSrc}
        onImageSrcChange={(newImageSrc) => {
          setImageSrc(newImageSrc);
          setEditedCoverPhoto(true);
        }}
        onPositionChange={() => {
          setEditedCoverPhoto(true);
        }}
        onScaleChange={() => {
          setEditedCoverPhoto(true);
        }}
        height={450}
        width={600}
        showZoom
        renderUploadIcon={() => (
          <BxsCloudUpload className="text-gray-500 h-32 w-32 -mb-2" />
        )}
        getRef={(ref) => {
          editor.current = ref;
        }}
      />
    </div>
  );
}