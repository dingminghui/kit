import type { CSSProperties, HTMLAttributes } from "react";

import actionCopySvg from "./svg/action-copy.svg?raw";
import actionDislikeSolidSvg from "./svg/action-dislike-solid.svg?raw";
import actionDislikeSvg from "./svg/action-dislike.svg?raw";
import actionLikeSolidSvg from "./svg/action-like-solid.svg?raw";
import actionLikeSvg from "./svg/action-like.svg?raw";
import actionRegenerateSvg from "./svg/action-regenerate.svg?raw";
import actionRetrySvg from "./svg/action-retry.svg?raw";
import actionArrowUpSvg from "./svg/action-arrow-up.svg?raw";
import actionStopSvg from "./svg/action-stop.svg?raw";
import chatAssistantSvg from "./svg/chat-assistant.svg?raw";
import chatUserSvg from "./svg/chat-user.svg?raw";
import contentCodeSvg from "./svg/content-code.svg?raw";
import contentImageSvg from "./svg/content-image.svg?raw";
import contentLinkSvg from "./svg/content-link.svg?raw";
import contentTableSvg from "./svg/content-table.svg?raw";
import fileDocSvg from "./svg/file-doc.svg?raw";
import fileGenericSvg from "./svg/file-generic.svg?raw";
import fileImageSvg from "./svg/file-image.svg?raw";
import filePdfSvg from "./svg/file-pdf.svg?raw";
import statusErrorSvg from "./svg/status-error.svg?raw";
import statusLoadingSvg from "./svg/status-loading.svg?raw";
import statusSuccessSvg from "./svg/status-success.svg?raw";

export type ChatIconKey =
  | "chat.assistant"
  | "chat.user"
  | "action.copy"
  | "action.dislike"
  | "action.dislike.solid"
  | "action.like"
  | "action.like.solid"
  | "action.regenerate"
  | "action.arrow-up"
  | "action.stop"
  | "action.retry"
  | "status.loading"
  | "status.error"
  | "status.success"
  | "file.pdf"
  | "file.image"
  | "file.doc"
  | "file.generic"
  | "content.table"
  | "content.code"
  | "content.image"
  | "content.link";

export const chatIconRegistry = {
  "chat.assistant": chatAssistantSvg,
  "chat.user": chatUserSvg,
  "action.copy": actionCopySvg,
  "action.dislike": actionDislikeSvg,
  "action.dislike.solid": actionDislikeSolidSvg,
  "action.like": actionLikeSvg,
  "action.like.solid": actionLikeSolidSvg,
  "action.regenerate": actionRegenerateSvg,
  "action.arrow-up": actionArrowUpSvg,
  "action.stop": actionStopSvg,
  "action.retry": actionRetrySvg,
  "status.loading": statusLoadingSvg,
  "status.error": statusErrorSvg,
  "status.success": statusSuccessSvg,
  "file.pdf": filePdfSvg,
  "file.image": fileImageSvg,
  "file.doc": fileDocSvg,
  "file.generic": fileGenericSvg,
  "content.table": contentTableSvg,
  "content.code": contentCodeSvg,
  "content.image": contentImageSvg,
  "content.link": contentLinkSvg,
} satisfies Record<ChatIconKey, string>;

export interface ChatIconProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  name: ChatIconKey;
  size?: number | string;
}

function normalizeSvgMarkup(svg: string) {
  return svg.replace(/<svg([^>]*)>/, (_match, attrs: string) => {
    const cleanedAttrs = attrs.replace(/\s(width|height)="[^"]*"/g, "");
    return `<svg${cleanedAttrs} width="100%" height="100%" aria-hidden="true" focusable="false">`;
  });
}

export const ChatIcon = ({ name, size, style, ...props }: ChatIconProps) => {
  const iconMarkup = normalizeSvgMarkup(chatIconRegistry[name]);
  const iconStyle: CSSProperties = {
    width: size,
    height: size,
    display: "inline-block",
    lineHeight: 0,
    color: "inherit",
    ...style,
  };

  return <span style={iconStyle} dangerouslySetInnerHTML={{ __html: iconMarkup }} {...props} />;
};

ChatIcon.displayName = "ChatIcon";
