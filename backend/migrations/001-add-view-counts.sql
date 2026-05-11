-- Migration: Add view tracking columns to uploaded_files and posts tables

-- Add view_count column to uploaded_files if it doesn't exist
ALTER TABLE uploaded_files ADD COLUMN view_count INTEGER DEFAULT 0;

-- Add view_count column to posts if it doesn't exist
ALTER TABLE posts ADD COLUMN view_count INTEGER DEFAULT 0;
