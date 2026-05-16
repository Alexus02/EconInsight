import React, { useState } from 'react'
import FileUpload from '../file-upload'
import PDFPreview from '../pdf-preview'
import '../../styles/adminStyles/admin-post-form-pages.css'

const AdminPostForm = ({
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
  onSubmit,
  onSaveDraft,
  onPreview,
  onCoverImageChange,
  onRemoveCoverImage,
}) => {
  const [currentStep, setCurrentStep] = useState(1)

  const canContinue = () => {
    if (currentStep === 1) {
      return title.trim() && excerpt.trim()
    }
    if (currentStep === 2) {
      return true
    }
    return true
  }

  const handleNext = () => {
    if (canContinue() && currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePublish = (e) => {
    e.preventDefault()
    onSubmit(e)
  }

  return (
    <form className="admin-post-form admin-post-form--paginated" onSubmit={handlePublish}>
      {/* Step Indicator */}
      <div className="form-steps-header">
        <div className="form-steps">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`form-step ${currentStep === step ? 'form-step--active' : ''} ${
                step < currentStep ? 'form-step--completed' : ''
              }`}
              onClick={() => {
                if (step < currentStep || (step === currentStep + 1 && canContinue())) {
                  setCurrentStep(step)
                }
              }}
            >
              <div className="form-step__number">{step}</div>
              <div className="form-step__label">
                {step === 1 && 'Post Details'}
                {step === 2 && 'Upload Media'}
                {step === 3 && 'Preview'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Page 1: Post Details */}
      {currentStep === 1 && (
        <div className="form-page form-page--active">
          <h2>Post Details</h2>

          <div className="admin-type-toggle" role="tablist" aria-label="Post type selector">
            <button
              type="button"
              className={`admin-type-toggle__btn ${postType === 'article' ? 'admin-type-toggle__btn--active' : ''}`}
              onClick={() => onPostTypeChange('article')}
            >
              Research Article
            </button>
            <button
              type="button"
              className={`admin-type-toggle__btn ${postType === 'blog' ? 'admin-type-toggle__btn--active' : ''}`}
              onClick={() => onPostTypeChange('blog')}
            >
              Blog Post
            </button>
          </div>

          <label className="form-field">
            Title *
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Post Title..."
              required
            />
          </label>

          <label className="form-field">
            Category
            <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
              <option value="">Select category</option>
              <option value="macro">Macroeconomics</option>
              <option value="policy">Policy</option>
              <option value="markets">Markets</option>
              <option value="insights">Insights</option>
            </select>
          </label>

          <label className="form-field">
            Summary / Excerpt *
            <textarea
              rows={3}
              value={excerpt}
              onChange={(e) => onExcerptChange(e.target.value)}
              placeholder="Write a short summary..."
              required
            />
          </label>

          {postType === 'blog' ? (
            <label className="form-field">
              Body / Content
              <textarea
                rows={6}
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Write your blog content..."
              />
            </label>
          ) : null}

        </div>
      )}

      {/* Page 2: Upload Media */}
      {currentStep === 2 && (
        <div className="form-page form-page--active">
          <h2>Upload Media</h2>

          {/* Images Upload */}
          <div className="media-section">
            <div className="media-section__header">
              <h3>Image assets</h3>
              <p>Upload cover photos and inline images. This section only accepts image files.</p>
            </div>

            <div className="media-actions">
              <FileUpload
                uploaderId="host"
                onUploaded={onFileUpload}
                label="Upload Images"
                title="Add post images"
                kicker="Cover photo + inline media"
                hint="Choose JPG, PNG, or JPEG files. These become your visual assets."
                badge="Images only"
                variant="images"
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              />
            </div>

            {uploadedFiles.filter((f) => f.contentType?.startsWith('image/')).length > 0 && (
              <div className="uploaded-images-list">
                <h4>Uploaded Images</h4>
                <div className="images-grid">
                  {uploadedFiles
                    .filter((f) => f.contentType?.startsWith('image/'))
                    .map((f) => (
                      <div key={f.id || f.storageKey} className="image-thumbnail">
                        <img src={f.url} alt={f.filename} />
                        <span className="image-name">{f.filename}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Cover Photo Selection */}
          <div className="media-section">
            <div className="media-section__header">
              <h3>Cover photo</h3>
              <p>Select one image to feature at the top of the post.</p>
            </div>

            {uploadedFiles.filter((f) => f.contentType?.startsWith('image/')).length > 0 ? (
              <>
                <div className="media-actions">
                  <select 
                    className="form-field" 
                    onChange={(e) => {
                      const url = e.target.value
                      if (url) {
                        onCoverImageChange(url)
                      }
                    }}
                    value={selectedImageUrls[0] || ''}
                  >
                    <option value="">-- Select Cover Photo --</option>
                    {uploadedFiles
                      .filter((f) => f.contentType?.startsWith('image/'))
                      .map((f) => (
                        <option key={f.id || f.storageKey || f.url} value={f.url}>
                          {f.filename}
                        </option>
                      ))}
                  </select>
                </div>

                {selectedImageUrls[0] ? (
                  <div className="cover-photo-preview">
                    <img src={selectedImageUrls[0]} alt="Cover preview" className="cover-photo-preview__image" />
                    <button type="button" className="cover-photo-preview__remove" onClick={() => onRemoveCoverImage()}>
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div className="cover-photo-placeholder">No cover photo selected</div>
                )}
              </>
            ) : (
              <div className="cover-photo-placeholder">No images uploaded yet. Upload images above to select a cover photo.</div>
            )}
          </div>

          {/* Document Upload */}
          <div className="media-section">
            <div className="media-section__header">
              <h3>Document file</h3>
              <p>Upload the PDF or DOC/DOCX attachment for readers to preview and download.</p>
            </div>

            <div className="media-actions">
              <FileUpload
                uploaderId="host"
                onUploaded={onFileUpload}
                label="Upload Document"
                title="Add article file"
                kicker="PDF / DOC uploads"
                hint="Choose PDF, DOC, or DOCX files. This section is for document attachments only."
                badge="Documents only"
                variant="documents"
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.doc,.docx"
              />
            </div>

            <label className="form-field">
              Choose a Document
              <input
                list="uploadedFilesList"
                placeholder="Select uploaded document"
                className="searchable-select"
                value={selectedDocLabel}
                onChange={(e) => onDocLabelChange(e.target.value)}
                onBlur={onDocBlur}
              />
              <datalist id="uploadedFilesList">
                {uploadedFiles
                  .filter((f) => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.contentType))
                  .map((f) => (
                    <option key={f.id || f.storageKey || f.url} value={f.filename} />
                  ))}
              </datalist>
            </label>

            {selectedDocUrl ? (
              <div className="document-preview">
                {selectedFile?.contentType === 'application/pdf' || selectedDocUrl.endsWith('.pdf') ? (
                  <PDFPreview
                    title={selectedFile?.filename || 'preview'}
                    url={selectedDocUrl}
                    className="document-preview__pdf"
                    showControls={false}
                    showTextSnippet={false}
                  />
                ) : (
                  <div className="document-preview__info">Selected: {selectedFile?.filename || selectedDocUrl}</div>
                )}
              </div>
            ) : (
              <div className="document-placeholder">No document selected</div>
            )}
          </div>
        </div>
      )}

      {/* Page 3: Preview */}
      {currentStep === 3 && (
        <div className="form-page form-page--active">
          <h2>Preview</h2>

          {/* Card View */}
          <div className="preview-section">
            <h3>Card View</h3>
            <p className="preview-section__help">How it appears in listings</p>
            <div className="preview-card">
              {selectedImageUrls[0] && (
                <div className="preview-card__image">
                  <img src={selectedImageUrls[0]} alt={title} />
                </div>
              )}
              <div className="preview-card__content">
                <h4 className="preview-card__title">{title || 'Post Title'}</h4>
                <p className="preview-card__excerpt">{excerpt || 'Post summary will appear here...'}</p>
                <div className="preview-card__meta">
                  <span className="preview-card__type">{postType === 'blog' ? 'Blog' : 'Article'}</span>
                  {category && <span className="preview-card__category">{category}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Article View */}
          <div className="preview-section">
            <h3>Article Layout</h3>
            <p className="preview-section__help">Select how the article will be displayed</p>
            
            {postType === 'article' && (
              <div className="layout-selector">
                <label className="form-field">
                  Display Layout
                  <select value={articleLayout || 'full-width'} onChange={(e) => onArticleLayoutChange(e.target.value)}>
                    <option value="full-width">Full Width - Document Full Width</option>
                    <option value="two-column">Two Column - Text + Document Side by Side</option>
                    <option value="embedded">Embedded - Document Inline with Text</option>
                    <option value="carousel">Carousel - Images/Document Carousel</option>
                    <option value="alternate">Alternate - Image, Text, Image Pattern</option>
                  </select>
                </label>
              </div>
            )}

            <div className={`preview-article preview-article--${articleLayout || 'full-width'}`}>
              {/* Cover Image */}
              {selectedImageUrls[0] && (
                <img src={selectedImageUrls[0]} alt={title} className="preview-article__image" />
              )}

              <div className="preview-article__header">
                <h1 className="preview-article__title">{title || 'Post Title'}</h1>
                <p className="preview-article__excerpt">{excerpt || 'Post summary will appear here...'}</p>
              </div>

              {/* Layout Previews */}
              {postType === 'article' ? (
                <>
                  {(articleLayout === 'two-column' || !articleLayout) && (
                    <div className="preview-layout-two-column">
                      <div className="preview-column">
                        <p>{excerpt || 'Article summary...'}</p>
                      </div>
                      <div className="preview-column">
                        {selectedDocUrl ? (
                          <div className="preview-document-placeholder">
                            <span>📄</span>
                            <p>{selectedFile?.filename || 'Document'}</p>
                          </div>
                        ) : (
                          <div className="preview-document-placeholder empty">
                            <p>Document will appear here</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {articleLayout === 'embedded' && (
                    <div className="preview-layout-embedded">
                      <p>{excerpt || 'Article summary...'}</p>
                      {selectedDocUrl ? (
                        <div className="preview-document-embedded">
                          <span>📄</span> {selectedFile?.filename || 'Document'} - Embedded
                        </div>
                      ) : (
                        <div className="preview-document-embedded empty">
                          Document embedded in page
                        </div>
                      )}
                    </div>
                  )}

                  {articleLayout === 'carousel' && (
                    <div className="preview-layout-carousel">
                      <div className="preview-carousel">
                        <div className="carousel-main">
                          {selectedImageUrls[0] ? (
                            <img src={selectedImageUrls[0]} alt="Carousel" />
                          ) : (
                            <div className="carousel-empty">Image</div>
                          )}
                        </div>
                        {(selectedImageUrls.length > 1 || selectedDocUrl) && (
                          <div className="carousel-thumbnails">
                            {selectedImageUrls.slice(0, 3).map((url, idx) => (
                              <div key={idx} className="carousel-thumb">
                                <img src={url} alt={`Thumb ${idx}`} />
                              </div>
                            ))}
                            {selectedDocUrl && (
                              <div className="carousel-thumb doc">📄</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {articleLayout === 'alternate' && (
                    <div className="preview-layout-alternate">
                      {selectedImageUrls[0] && (
                        <div className="preview-item-image">
                          <img src={selectedImageUrls[0]} alt="Content" />
                        </div>
                      )}
                      <div className="preview-item-text">
                        <p>{excerpt || 'Article content...'}</p>
                      </div>
                      {selectedImageUrls[1] && (
                        <div className="preview-item-image">
                          <img src={selectedImageUrls[1]} alt="Content 2" />
                        </div>
                      )}
                    </div>
                  )}

                  {articleLayout === 'full-width' && (
                    <div className="preview-layout-full-width">
                      {selectedDocUrl ? (
                        <div className="preview-document-full">
                          <span>📄</span> {selectedFile?.filename || 'Document'} - Full Width
                        </div>
                      ) : (
                        <div className="preview-document-full empty">
                          Document will display full width
                        </div>
                      )}
                      <div className="preview-content">
                        <p>{excerpt || 'Article content...'}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Blog Preview */}
                  <div className="preview-article__content">
                    <p>{content || 'Blog content will appear here...'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Navigation Buttons */}
      <div className="form-navigation">
        <button
          type="button"
          className="form-nav-btn form-nav-btn--secondary"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          ← Previous
        </button>

        {currentStep < 3 && (
          <button
            type="button"
            className="form-nav-btn form-nav-btn--primary"
            onClick={handleNext}
            disabled={!canContinue()}
          >
            Next →
          </button>
        )}

        {currentStep === 3 && (
          <div className="form-publish-actions">
            <button type="submit" className="form-nav-btn form-nav-btn--success" disabled={isSubmitting}>
              {isSubmitting ? '✓ Publishing...' : '✓ Publish'}
            </button>
            <button
              type="button"
              className="form-nav-btn form-nav-btn--secondary"
              onClick={() => onSaveDraft()}
              disabled={isSubmitting}
            >
              📝 Save Draft
            </button>
          </div>
        )}
      </div>
    </form>
  )
}

export default AdminPostForm
    