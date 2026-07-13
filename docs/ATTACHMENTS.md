# Attachment Components

## Overview

Seven components in `src/components/attachments/`:

| Component | Purpose |
|-----------|---------|
| `AttachmentList` | Container — renders list + upload form |
| `AttachmentCard` | Single file card with metadata + actions |
| `AttachmentUploadForm` | File input, category select, upload button |
| `UploadProgress` | Progress bar with cancel |
| `AttachmentStatusBadge` | Color-coded status pill |
| `ScanStatusBadge` | Color-coded scan-status pill |
| `attachmentUtils` | Category labels, category array for selects |

## Data Flow

```
ConsultationDetailPage
  └─ AttachmentList
       ├─ AttachmentUploadForm ──→ attachmentsApi.upload()
       └─ AttachmentCard[] ──→ attachmentsApi.download() / delete()
```

## Integration Pattern

Add to any consultation detail page:

```tsx
import { AttachmentList } from "../../components/attachments/AttachmentList";
import { attachmentsApi } from "../../api/attachments";

// Inside component:
const [error, setError] = useState("");
const queryClient = useQueryClient();

const { data } = useQuery({
  queryKey: ["attachments", consultationId],
  queryFn: () => attachmentsApi.list(consultationId),
});

<AttachmentList
  attachments={data?.results || []}
  loading={isLoading}
  onUpload={handleUpload}
  onDownload={triggerDownload}
  onDelete={handleDelete}
  showUpload={true}
/>
```

## API Client (`src/api/attachments.ts`)

- `list(consultationId)` — GET paginated
- `get(id)` — GET detail
- `upload(consultationId, file, category, description, onProgress, signal)` —
  POST multipart with progress tracking + AbortController
- `download(id)` — GET blob + filename from Content-Disposition
- `delete(id)` — DELETE soft-delete
- `restore(id)` — POST restore (staff only)

## Role Behavior

| Role | Upload | Download | Delete |
|------|--------|----------|--------|
| Patient | Own consultation | Own consultation | Own uploads |
| Doctor | Assigned cons. | Assigned cons. | Own uploads |
| Staff | Any | Any | Any (with reason) |
