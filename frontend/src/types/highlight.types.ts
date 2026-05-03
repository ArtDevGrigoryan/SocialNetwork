import type { IArchiveStoryData } from "./story.types";

export interface IHighlight {
  _id: string;
  title: string;
  cover: string;
  user: string;
  archives: IArchiveStoryData[];
}
