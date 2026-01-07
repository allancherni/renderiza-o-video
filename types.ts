export interface Caption {
  start: string;
  end: string;
  text: string;
}

export interface VersionOutput {
  id: string;
  title: string;
  captions: Caption[];
  notes: string;
}