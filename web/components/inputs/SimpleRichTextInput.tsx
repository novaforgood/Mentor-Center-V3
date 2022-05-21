import { useEffect } from "react";

import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  useEditor,
  EditorContent,
  EditorContentProps,
  EditorEvents,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type SimpleRichTextInputProps = Omit<EditorContentProps, "editor" | "ref"> & {
  placeholder?: string;
  characterLimit?: number;
  onUpdate?: (props: EditorEvents["update"]) => void;
  editable?: boolean;
  initContent?: string;
  unstyled?: boolean;
};

/**
 *
 * Note: More styling is configured in globals.css
 *
 */
export const SimpleRichTextInput = (props: SimpleRichTextInputProps) => {
  const {
    placeholder,
    characterLimit,
    editable = true,
    initContent,
    unstyled = false,
    onUpdate = () => {},
    ...rest
  } = props;

  const editor = useEditor({
    // https://tiptap.dev/api/extensions/starter-kit
    onUpdate,
    editable,
    parseOptions: {
      preserveWhitespace: "full",
    },
    content: initContent,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        codeBlock: false,
        hardBreak: false,
        heading: false,
        horizontalRule: false,
        listItem: false,
        orderedList: false,

        code: false,
        strike: false,
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
      Link.configure({
        HTMLAttributes: {
          class: "underline cursor-pointer text-teal-500",
        },
      }),
      CharacterCount.configure({
        limit: characterLimit,
      }),
    ],
    editorProps: {
      attributes: {
        class: unstyled
          ? ""
          : "border border-gray-400 focus:border-black rounded-md px-4 focus:outline-none transition w-full",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || !initContent) {
      return;
    }
    editor.commands.setContent(initContent);
  }, [editor, initContent]);

  return (
    <div className="w-full">
      <EditorContent {...rest} editor={editor} />
      {characterLimit && (
        <div className="mt-1 flex justify-end text-gray-400 break-words">
          {editor?.storage.characterCount.characters()} / {characterLimit}{" "}
          characters
        </div>
      )}
    </div>
  );
};
