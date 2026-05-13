import React from 'react'
import AdminPostForm from '../../components/admin/AdminPostForm'

const Posts = ({
  postType,
  title,
  excerpt,
  content,
  category,
  selectedDocUrl,
  selectedDocLabel,
  selectedFile,
  articleLayout,
  uploadedFiles,
  selectedImageUrls,
  isSubmitting,
  statusMessage,
  error,
  onPostTypeChange,
  onTitleChange,
  onExcerptChange,
  onContentChange,
  onCategoryChange,
  onDocLabelChange,
  onDocBlur,
  onArticleLayoutChange,
  onFileUpload,
  onCoverImageChange,
  onRemoveCoverImage,
  onSubmit,
  onSaveDraft,
  onPreview,
}) => {
  return (
    <div className="admin-page-content">
      <AdminPostForm
        postType={postType}
        title={title}
        excerpt={excerpt}
        content={content}
        category={category}
        selectedDocUrl={selectedDocUrl}
        selectedDocLabel={selectedDocLabel}
        selectedFile={selectedFile}
        articleLayout={articleLayout}
        uploadedFiles={uploadedFiles}
        selectedImageUrls={selectedImageUrls}
        isSubmitting={isSubmitting}
        statusMessage={statusMessage}
        error={error}
        onPostTypeChange={onPostTypeChange}
        onTitleChange={onTitleChange}
        onExcerptChange={onExcerptChange}
        onContentChange={onContentChange}
        onCategoryChange={onCategoryChange}
        onDocLabelChange={onDocLabelChange}
        onDocBlur={onDocBlur}
        onArticleLayoutChange={onArticleLayoutChange}
        onFileUpload={onFileUpload}
        onCoverImageChange={onCoverImageChange}
        onRemoveCoverImage={onRemoveCoverImage}
        onSubmit={onSubmit}
        onSaveDraft={onSaveDraft}
        onPreview={onPreview}
      />
    </div>
  )
}

export default Posts
