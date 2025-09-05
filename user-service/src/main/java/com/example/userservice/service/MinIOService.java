package com.example.userservice.service;

import io.minio.*;
import io.minio.errors.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

@Service
public class MinIOService {

    private static final Logger logger = LoggerFactory.getLogger(MinIOService.class);

    @Value("${minio.url}")
    private String minioUrl;

    @Value("${minio.public-url}")
    private String minioPublicUrl;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    private static final String BUCKET_NAME = "portfolio";
    private static final String PROFILE_FOLDER = "profiles/";
    private static final String PROJECT_FOLDER = "projects/";

    private MinioClient getMinioClient() {
        return MinioClient.builder()
                .endpoint(minioUrl)
                .credentials(accessKey, secretKey)
                .build();
    }

    private void ensureBucketExists() throws Exception {
        MinioClient minioClient = getMinioClient();
        
        boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(BUCKET_NAME).build());
        if (!bucketExists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(BUCKET_NAME).build());
            logger.info("Created bucket: {}", BUCKET_NAME);
        }
        
        // Always set bucket policy for public read access (in case it's not set)
        String policy = String.format("""
            {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Principal": "*",
                  "Action": ["s3:GetObject"],
                  "Resource": "arn:aws:s3:::%s/*"
                }
              ]
            }
            """, BUCKET_NAME);
        
        try {
            minioClient.setBucketPolicy(SetBucketPolicyArgs.builder()
                .bucket(BUCKET_NAME)
                .config(policy)
                .build());
            
            logger.info("Set public read policy for bucket: {}", BUCKET_NAME);
        } catch (Exception e) {
            logger.warn("Failed to set bucket policy: {}", e.getMessage());
        }
    }

    public String uploadProfileImage(MultipartFile file, Long userId) throws Exception {
        String filename = PROFILE_FOLDER + userId + "_" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        return uploadFile(file, filename);
    }

    public String uploadProjectImage(MultipartFile file, Long userId) throws Exception {
        String filename = PROJECT_FOLDER + userId + "_" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        return uploadFile(file, filename);
    }

    private String uploadFile(MultipartFile file, String filename) throws Exception {
        ensureBucketExists();
        
        MinioClient minioClient = getMinioClient();
        
        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(BUCKET_NAME)
                    .object(filename)
                    .stream(inputStream, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build()
            );
        }
        
        // Return path only, not full URL
        return "/" + BUCKET_NAME + "/" + filename;
    }

    public void deleteFile(String fileUrl) {
        try {
            if (fileUrl != null && fileUrl.contains(minioUrl)) {
                String filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
                MinioClient minioClient = getMinioClient();
                minioClient.removeObject(
                    RemoveObjectArgs.builder()
                        .bucket(BUCKET_NAME)
                        .object(filename)
                        .build()
                );
                logger.info("Deleted file: {}", filename);
            }
        } catch (Exception e) {
            logger.error("Failed to delete file: {}", fileUrl, e);
        }
    }
}