import type { Book, BookTag, Category, Tag } from "@prisma/client";
import { bookStatusLabels } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { UploadField } from "@/components/admin/upload-field";

type BookWithTags = Book & { tags: BookTag[] };

export function AdminBookForm({
  book,
  categories,
  tags,
  action
}: {
  book?: BookWithTags | null;
  categories: Category[];
  tags: Tag[];
  action: (formData: FormData) => Promise<void>;
}) {
  const selectedTags = new Set(book?.tags.map((item) => item.tagId) ?? []);

  return (
    <form action={action} className="grid gap-6">
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">Core information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField name="title" label="Title" defaultValue={book?.title} required />
          <TextField name="slug" label="Slug" defaultValue={book?.slug} required />
          <TextField name="subtitle" label="Subtitle" defaultValue={book?.subtitle} />
          <TextField name="author" label="Author" defaultValue={book?.author} required />
          <TextField
            name="publisher"
            label="Publisher"
            defaultValue={book?.publisher || "Ayesha-Sharif Publication"}
            required
          />
          <TextField name="isbn13" label="ISBN-13" defaultValue={book?.isbn13} />
          <TextField name="edition" label="Edition" defaultValue={book?.edition} />
          <TextField
            name="language"
            label="Language"
            defaultValue={book?.language || "Bangla"}
            required
          />
          <TextField
            name="pages"
            label="Pages"
            type="number"
            defaultValue={book?.pages?.toString()}
          />
          <TextField name="binding" label="Binding" defaultValue={book?.binding} />
          <TextField
            name="publicationDate"
            label="Publication date"
            type="date"
            defaultValue={book?.publicationDate?.toISOString().slice(0, 10)}
          />
          <TextField
            name="weight"
            label="Weight in grams"
            type="number"
            defaultValue={book?.weight?.toString()}
          />
        </div>
        <div className="mt-4 grid gap-4">
          <label>
            <span className="form-label">Short description</span>
            <textarea
              name="shortDescription"
              rows={3}
              defaultValue={book?.shortDescription || ""}
              className="form-input mt-1"
            />
          </label>
          <label>
            <span className="form-label">Full description</span>
            <textarea
              name="description"
              rows={7}
              defaultValue={book?.description || ""}
              className="form-input mt-1"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">Pricing and stock</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            name="regularPrice"
            label="Regular price"
            type="number"
            defaultValue={book ? Number(book.regularPrice).toString() : ""}
            required
          />
          <TextField
            name="salePrice"
            label="Sale price"
            type="number"
            defaultValue={book ? Number(book.salePrice).toString() : ""}
            required
          />
          <TextField
            name="discountPercent"
            label="Discount percent"
            type="number"
            defaultValue={book?.discountPercent?.toString() || "0"}
          />
          <TextField
            name="stockQuantity"
            label="Stock quantity"
            type="number"
            defaultValue={book?.stockQuantity?.toString() || "0"}
            required
          />
          <TextField
            name="discountStart"
            label="Discount start"
            type="date"
            defaultValue={book?.discountStart?.toISOString().slice(0, 10)}
          />
          <TextField
            name="discountEnd"
            label="Discount end"
            type="date"
            defaultValue={book?.discountEnd?.toISOString().slice(0, 10)}
          />
          <label>
            <span className="form-label">Status</span>
            <select name="status" defaultValue={book?.status || "draft"} className="form-input mt-1">
              {Object.entries(bookStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="form-label">Category</span>
            <select
              name="categoryId"
              defaultValue={book?.categoryId || ""}
              className="form-input mt-1"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">Assets</h2>
        <div className="mt-4 grid gap-4">
          <UploadField
            name="coverImage"
            label="Cover image"
            type="cover"
            accept="image/png,image/jpeg,image/webp"
            defaultValue={book?.coverImage || ""}
          />
          <UploadField
            name="galleryImages"
            label="Gallery images"
            type="gallery"
            accept="image/png,image/jpeg,image/webp"
            multiple
            defaultValue={book?.galleryImages.join(",") || ""}
          />
          <UploadField
            name="samplePdf"
            label="Sample PDF"
            type="sample"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            defaultValue={book?.samplePdf || ""}
          />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-navy">Labels and tags</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Checkbox name="isFeatured" label="Featured" checked={book?.isFeatured} />
          <Checkbox name="isBestSeller" label="Best Seller" checked={book?.isBestSeller} />
          <Checkbox name="isNewArrival" label="New Arrival" checked={book?.isNewArrival} />
          <Checkbox name="isRecommended" label="Recommended" checked={book?.isRecommended} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <label
              key={tag.id}
              className="inline-flex items-center gap-2 rounded-md border border-line bg-page px-3 py-2 text-sm font-bold"
            >
              <input
                type="checkbox"
                name="tagIds"
                value={tag.id}
                defaultChecked={selectedTags.has(tag.id)}
              />
              {tag.name}
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="focus-ring min-h-12 rounded-md bg-emerald px-6 py-3 text-sm font-extrabold text-white"
        >
          Save book
        </button>
        {book ? (
          <p className="text-sm text-muted">Last updated {formatDate(book.updatedAt)}</p>
        ) : null}
      </div>
    </form>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  type = "text",
  required = false
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="form-label">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue || ""}
        className="form-input mt-1"
      />
    </label>
  );
}

function Checkbox({
  name,
  label,
  checked
}: {
  name: string;
  label: string;
  checked?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-md border border-line bg-page px-3 py-2 text-sm font-bold">
      <input type="checkbox" name={name} defaultChecked={checked} />
      {label}
    </label>
  );
}
