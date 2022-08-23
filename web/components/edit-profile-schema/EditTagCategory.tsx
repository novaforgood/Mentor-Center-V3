import React, { useCallback, useEffect, useState } from "react";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  MeasuringStrategy,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  defaultAnimateLayoutChanges,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import toast from "react-hot-toast";

import {
  Space_Tag_Category_Insert_Input,
  Space_Tag_Insert_Input,
} from "../../generated/graphql";
import { getTempId } from "../../lib/tempId";
import {
  NewListingQuestion,
  NewSpaceTag,
  NewTagCategory,
} from "../../lib/types";
import { Button, Input, Text } from "../atomic";
import { DeleteButton } from "../DeleteButton";
import { DragHandle } from "../DragHandle";
import { EditButton } from "../EditButton";
import { TextInput } from "../inputs/TextInput";
import { ActionModal } from "../modals/ActionModal";
import { Tag, TagProps } from "../Tag";

type EditMode = "normal" | "reorder";
interface EditTagProps extends TagProps {
  mode: EditMode;
  tagId: string;
}
function EditTag(props: EditTagProps) {
  const { mode, tagId, onDeleteClick, renderRightIcon, ...rest } = props;

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: tagId,
    });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} {...attributes} style={style} className="cursor-auto">
      <Tag
        {...rest}
        renderRightIcon={
          mode === "reorder"
            ? () => {
                return (
                  <DragHandle
                    sizeClassName="h-3 w-3 ml-1 -mr-1"
                    {...listeners}
                  />
                );
              }
            : undefined
        }
        onDeleteClick={mode === "normal" ? onDeleteClick : undefined}
      />
    </div>
  );
}

type EditTagCategoryProps = {
  tagCategory: NewTagCategory;
  onSave?: (tagCategory: NewTagCategory) => void;
  onDelete?: () => void;
};

export function EditTagCategory(props: EditTagCategoryProps) {
  const { tagCategory, onSave = () => {}, onDelete = () => {} } = props;

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: props.tagCategory.id,
    });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const [isOpen, setIsOpen] = useState(false);

  const [title, setTitle] = useState(tagCategory.title ?? "");
  const [tags, setTags] = useState<NewSpaceTag[]>(
    tagCategory.space_tags?.data ?? []
  );
  const [newTag, setNewTag] = useState("");

  const [editMode, setEditMode] = useState<EditMode>("normal");
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over) {
      return;
    }

    if (active.id !== over.id) {
      setTags((prev) => {
        const ids = prev.map((item) => item.id);
        const oldIndex = ids.indexOf(active.id as string);
        const newIndex = ids.indexOf(over.id as string);

        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTitle(tagCategory.title ?? "");
      setTags(tagCategory.space_tags?.data ?? []);
      setNewTag("");
    }
  }, [isOpen, tagCategory.space_tags, tagCategory.title]);

  const addTag = () => {
    if (newTag.length === 0) {
      return;
    }

    const existingTagIndex = tags.findIndex((tag) => tag.label === newTag);
    if (existingTagIndex !== -1) {
      const existingTag = tags[existingTagIndex];
      if (existingTag.deleted === true) {
        setTags((prev) => {
          return [
            ...prev.filter((tag) => tag.id !== existingTag.id),
            {
              ...existingTag,
              deleted: false,
            },
          ];
        });
        setNewTag("");
      } else {
        toast.error(`Tag ${newTag} already exists`);
        return;
      }
    } else {
      setTags((prev) => [
        ...prev,
        { label: newTag, deleted: false, id: getTempId() },
      ]);
      setNewTag("");
    }
  };

  const onClose = () => {
    setIsOpen(false);
    onSave({
      ...tagCategory,
      title,
      space_tags: {
        data: tags,
      },
    });
  };

  const tagContainerStyles = classNames({
    "flex flex-wrap items-start gap-2": editMode === "normal",
    "flex flex-col items-start gap-2": editMode === "reorder",
  });

  return (
    <>
      <ActionModal
        isOpen={isOpen}
        onClose={onClose}
        actionText="Done editing"
        onAction={onClose}
      >
        <div className="p-8 py-16 w-96 flex flex-col">
          <Text variant="heading4" className="text-center">
            Edit tag category
          </Text>
          <div className="h-8"></div>
          <TextInput
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="mb-4"
          />
          <div className="h-8"></div>
          <Text className="text-gray-700">
            Type and hit <Text bold>[enter]</Text> to create a tag.
          </Text>
          <div className="h-2"></div>
          <div className="flex items-center gap-2">
            <TextInput
              value={newTag}
              onValueChange={setNewTag}
              placeholder="Add tags"
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  addTag();
                }
              }}
            />
            <Button
              size="small"
              variant="outline"
              className="px-2 shrink-0"
              disabled={newTag.length === 0}
              onClick={addTag}
            >
              Add
            </Button>
          </div>

          <div className="h-4"></div>
          <div>
            <button
              className="text-xs hover:underline text-gray-600"
              onClick={() => {
                setEditMode(editMode === "reorder" ? "normal" : "reorder");
              }}
            >
              {editMode === "reorder" ? "Done reordering" : "Reorder Tags"}
            </button>
          </div>

          {editMode === "reorder" && (
            <div>
              <button
                className="text-xs hover:underline text-gray-600"
                onClick={() => {
                  // Sort tags alphabetically
                  setTags((prev) => [
                    ...prev.sort((a, b) => {
                      console.log(a.label, b.label);
                      if (!a.label || !b.label) {
                        return 0;
                      }
                      const aLower = a.label.toLowerCase();
                      const bLower = b.label.toLowerCase();
                      if (aLower < bLower) {
                        return -1;
                      } else if (aLower > bLower) {
                        return 1;
                      } else {
                        return 0;
                      }
                    }),
                  ]);
                }}
              >
                Sort alphabetical
              </button>
            </div>
          )}
          <div className="h-2"></div>

          <div className={tagContainerStyles}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={tags}
                strategy={verticalListSortingStrategy}
              >
                {tags
                  .filter((tag) => !tag.deleted)
                  .map((tag, index) => {
                    if (tag.deleted) {
                      return null;
                    }
                    return (
                      <EditTag
                        key={tag.id}
                        tagId={tag.id}
                        mode={editMode}
                        text={tag.label ?? ""}
                        onDeleteClick={() => {
                          setTags((prev) => {
                            return prev
                              .map((t) => {
                                if (!t.id) {
                                  if (t.label === tag.label) {
                                    return null;
                                  } else {
                                    return t;
                                  }
                                } else if (t.id === tag.id) {
                                  return { ...t, deleted: true };
                                } else {
                                  return t;
                                }
                              })
                              .filter((v) => v !== null) as NewSpaceTag[];
                          });
                        }}
                      />
                    );
                  })}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </ActionModal>
      <div
        className="flex flex-col cursor-auto"
        ref={setNodeRef}
        style={style}
        {...attributes}
      >
        <span className="inline-block align-baseline">
          <Text variant="subheading1">{tagCategory.title}</Text>
          <EditButton
            className=""
            onClick={() => {
              setIsOpen(true);
            }}
          />
          <DragHandle className="" {...listeners} />
          <DeleteButton className="" onClick={onDelete} />
        </span>

        <div className="h-2"></div>
        <div className="flex flex-wrap items-start gap-2">
          {tagCategory.space_tags?.data
            .filter((tag) => !tag.deleted)
            .map((tag, index) => (
              <Tag key={index} text={tag.label ?? ""} />
            ))}
        </div>
      </div>
    </>
  );
}
