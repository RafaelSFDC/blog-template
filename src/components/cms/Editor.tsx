import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/dist/index.css";
import { config } from "./puck.config";

interface EditorProps {
  data: Data;
  onSave: (data: Data) => Promise<void>;
  onChange?: (data: Data) => void;
}

export function Editor({ data, onSave, onChange }: EditorProps) {
  return (
    <div className="h-full min-h-[800px] border rounded-xl overflow-hidden bg-background">
      <Puck
        config={config}
        data={data}
        onPublish={onSave}
        onChange={onChange}
        headerPath="/dashboard/pages"
      />
    </div>
  );
}
