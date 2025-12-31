-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "HabitType" AS ENUM ('ADDICTION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "HabitCheckinStatus" AS ENUM ('SUCCESS', 'FAIL', 'SKIPPED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "GroupPostType" AS ENUM ('DAILY_CHECKIN', 'MOTIVATION', 'WORKOUT_CHECKIN', 'BODY_CHECKIN');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'FIRE', 'CLAP');

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploaded_by" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "weightKg" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "type" "HabitType" NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitRelapse" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "relapseAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitRelapse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitDailyCheckin" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "checkinDate" DATE NOT NULL,
    "status" "HabitCheckinStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitDailyCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HydrationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyGoalMl" INTEGER NOT NULL,
    "goalFormula" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HydrationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HydrationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "logDate" DATE NOT NULL,
    "amountMl" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HydrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "intervalMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "heightCm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyCheckin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartDate" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL,
    "bodyCheckinId" TEXT NOT NULL,
    "weightKg" DECIMAL(5,2),
    "waistCm" DECIMAL(5,2),
    "chestCm" DECIMAL(5,2),
    "hipCm" DECIMAL(5,2),
    "armCm" DECIMAL(5,2),
    "thighCm" DECIMAL(5,2),

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotivationalNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MotivationalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyCheckinPhoto" (
    "id" TEXT NOT NULL,
    "bodyCheckinId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "BodyCheckinPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateTable
CREATE TABLE "GroupPost" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "postType" "GroupPostType" NOT NULL,
    "content" TEXT,
    "postDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPostMedia" (
    "id" TEXT NOT NULL,
    "groupPostId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "GroupPostMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPostReaction" (
    "groupPostId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reaction" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPostReaction_pkey" PRIMARY KEY ("groupPostId","userId","reaction")
);

-- CreateTable
CREATE TABLE "GroupPostComment" (
    "id" TEXT NOT NULL,
    "groupPostId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPostComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "files_key_key" ON "files"("key");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Habit_ownerUserId_type_idx" ON "Habit"("ownerUserId", "type");

-- CreateIndex
CREATE INDEX "HabitRelapse_habitId_relapseAt_idx" ON "HabitRelapse"("habitId", "relapseAt");

-- CreateIndex
CREATE INDEX "HabitDailyCheckin_habitId_checkinDate_idx" ON "HabitDailyCheckin"("habitId", "checkinDate");

-- CreateIndex
CREATE UNIQUE INDEX "HabitDailyCheckin_habitId_checkinDate_key" ON "HabitDailyCheckin"("habitId", "checkinDate");

-- CreateIndex
CREATE UNIQUE INDEX "HydrationProfile_userId_key" ON "HydrationProfile"("userId");

-- CreateIndex
CREATE INDEX "HydrationLog_userId_logDate_idx" ON "HydrationLog"("userId", "logDate");

-- CreateIndex
CREATE INDEX "HydrationLog_userId_loggedAt_idx" ON "HydrationLog"("userId", "loggedAt");

-- CreateIndex
CREATE INDEX "NotificationRule_userId_type_idx" ON "NotificationRule"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "BodyProfile_userId_key" ON "BodyProfile"("userId");

-- CreateIndex
CREATE INDEX "BodyCheckin_userId_weekStartDate_idx" ON "BodyCheckin"("userId", "weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "BodyCheckin_userId_weekStartDate_key" ON "BodyCheckin"("userId", "weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "BodyMeasurement_bodyCheckinId_key" ON "BodyMeasurement"("bodyCheckinId");

-- CreateIndex
CREATE INDEX "MotivationalNote_userId_createdAt_idx" ON "MotivationalNote"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_ownerUserId_createdAt_idx" ON "MediaAsset"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "BodyCheckinPhoto_bodyCheckinId_idx" ON "BodyCheckinPhoto"("bodyCheckinId");

-- CreateIndex
CREATE UNIQUE INDEX "BodyCheckinPhoto_bodyCheckinId_position_key" ON "BodyCheckinPhoto"("bodyCheckinId", "position");

-- CreateIndex
CREATE INDEX "Group_ownerUserId_idx" ON "Group"("ownerUserId");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE INDEX "GroupPost_groupId_postDate_idx" ON "GroupPost"("groupId", "postDate");

-- CreateIndex
CREATE INDEX "GroupPost_groupId_createdAt_idx" ON "GroupPost"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "GroupPost_authorUserId_createdAt_idx" ON "GroupPost"("authorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "GroupPostMedia_groupPostId_idx" ON "GroupPostMedia"("groupPostId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPostMedia_groupPostId_position_key" ON "GroupPostMedia"("groupPostId", "position");

-- CreateIndex
CREATE INDEX "GroupPostReaction_groupPostId_createdAt_idx" ON "GroupPostReaction"("groupPostId", "createdAt");

-- CreateIndex
CREATE INDEX "GroupPostComment_groupPostId_createdAt_idx" ON "GroupPostComment"("groupPostId", "createdAt");

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitRelapse" ADD CONSTRAINT "HabitRelapse_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitDailyCheckin" ADD CONSTRAINT "HabitDailyCheckin_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HydrationProfile" ADD CONSTRAINT "HydrationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HydrationLog" ADD CONSTRAINT "HydrationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRule" ADD CONSTRAINT "NotificationRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyProfile" ADD CONSTRAINT "BodyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyCheckin" ADD CONSTRAINT "BodyCheckin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_bodyCheckinId_fkey" FOREIGN KEY ("bodyCheckinId") REFERENCES "BodyCheckin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotivationalNote" ADD CONSTRAINT "MotivationalNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyCheckinPhoto" ADD CONSTRAINT "BodyCheckinPhoto_bodyCheckinId_fkey" FOREIGN KEY ("bodyCheckinId") REFERENCES "BodyCheckin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyCheckinPhoto" ADD CONSTRAINT "BodyCheckinPhoto_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPost" ADD CONSTRAINT "GroupPost_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPost" ADD CONSTRAINT "GroupPost_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPostMedia" ADD CONSTRAINT "GroupPostMedia_groupPostId_fkey" FOREIGN KEY ("groupPostId") REFERENCES "GroupPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPostMedia" ADD CONSTRAINT "GroupPostMedia_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPostReaction" ADD CONSTRAINT "GroupPostReaction_groupPostId_fkey" FOREIGN KEY ("groupPostId") REFERENCES "GroupPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPostReaction" ADD CONSTRAINT "GroupPostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPostComment" ADD CONSTRAINT "GroupPostComment_groupPostId_fkey" FOREIGN KEY ("groupPostId") REFERENCES "GroupPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPostComment" ADD CONSTRAINT "GroupPostComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
