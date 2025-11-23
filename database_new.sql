-- database.sql for FINAL revised schema from 11/14/2025
-- MySQL 8.0.22 compatible | UTF8MB4 | ENGINE=InnoDB

CREATE TABLE Address (
  AddressID INT PRIMARY KEY AUTO_INCREMENT,
  StreetNumber INT,
  StreetName VARCHAR(256),
  City VARCHAR(256),
  Country VARCHAR(256)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Member (
  MemberID INT PRIMARY KEY AUTO_INCREMENT,
  Role ENUM('Regular','Author','Moderator'),
  Name VARCHAR(256) NOT NULL,
  Username VARCHAR(256) UNIQUE NOT NULL,
  Organization VARCHAR(256),
  AddressID INT,
  PrimaryEmail VARCHAR(256) NOT NULL,
  RecoveryEmail VARCHAR(256),
  Password VARCHAR(256) NOT NULL,
  ORCID CHAR(19) UNIQUE,
  Blacklisted BOOL DEFAULT FALSE,
  FOREIGN KEY (AddressID) REFERENCES Address(AddressID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Item (
  ItemID INT PRIMARY KEY AUTO_INCREMENT,
  AuthorID CHAR(19),
  Title VARCHAR(256) NOT NULL,
  PublicationDate DATETIME,
  UploadDate DATETIME,
  ApprovedBy INT,
  Topic VARCHAR(256),
  Type ENUM('Thesis','Article','Monograph & Book','Monograph Chapter','Conference Paper','Non-Thesis Graduate Project','Dataset'),
  Status ENUM('Under Review (Upload)','Available','Under Review (Plagiarism)','Removed'),
  ParentTitleID INT,
  Content VARCHAR(5000),
  UpdatedAt DATETIME,
  FOREIGN KEY (AuthorID) REFERENCES Member(ORCID),
  FOREIGN KEY (ApprovedBy) REFERENCES Member(MemberID),
  FOREIGN KEY (ParentTitleID) REFERENCES Item(ItemID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Comment (
  CommentID INT PRIMARY KEY AUTO_INCREMENT,
  ItemID INT NOT NULL,
  CommentorID INT NOT NULL,
  Comment VARCHAR(2048),
  Date DATETIME,
  ParentCommentID INT,
  Private Bool,
  FOREIGN KEY (ItemID) REFERENCES Item(ItemID),
  FOREIGN KEY (CommentorID) REFERENCES Member(MemberID),
  FOREIGN KEY (ParentCommentID) REFERENCES Comment(CommentID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Download (
  DownloadID INT PRIMARY KEY AUTO_INCREMENT,
  ItemID INT NOT NULL,
  DownloaderID INT NOT NULL,
  Date DATETIME,
  FOREIGN KEY (ItemID) REFERENCES Item(ItemID),
  FOREIGN KEY (DownloaderID) REFERENCES Member(MemberID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ChildrenCharity (
  ChildrenCharityID INT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(256) NOT NULL,
  Approved BOOL DEFAULT FALSE,
  SuggestedBy INT,
  FOREIGN KEY (SuggestedBy) REFERENCES Member(MemberID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Donation (
  DonationID INT PRIMARY KEY AUTO_INCREMENT,
  DonatorID INT NOT NULL,
  ItemID INT NOT NULL,
  ChildrenCharityID INT NOT NULL,
  Amount INT NOT NULL,
  AuthorPercent TINYINT NOT NULL,
  ChildrenCharityPercent TINYINT NOT NULL,
  CFPPercent TINYINT NOT NULL,
  Date DATETIME,
  CHECK (ChildrenCharityPercent >= 60),
  CHECK (AuthorPercent + ChildrenCharityPercent + CFPPercent = 100),
  FOREIGN KEY (DonatorID) REFERENCES Member(MemberID),
  FOREIGN KEY (ItemID) REFERENCES Item(ItemID),
  FOREIGN KEY (ChildrenCharityID) REFERENCES ChildrenCharity(ChildrenCharityID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Committee (
  CommitteeID INT PRIMARY KEY AUTO_INCREMENT,
  Name VARCHAR(256),
  Description VARCHAR(1024)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE MemberCommittee (
  MemberCommitteeID INT PRIMARY KEY AUTO_INCREMENT,
  MemberID INT NOT NULL,
  CommitteeID INT NOT NULL,
  FOREIGN KEY (MemberID) REFERENCES Member(MemberID),
  FOREIGN KEY (CommitteeID) REFERENCES Committee(CommitteeID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Discussion (
  DiscussionID INT PRIMARY KEY AUTO_INCREMENT,
  CommitteeID INT NOT NULL,
  ItemID INT NOT NULL,
  Subject VARCHAR(256),
  VoteActive BOOL,
  VotingDeadline DATETIME,
  Status ENUM('Open','Blacklisted','Dismissed','Appeal','Closed'),
  FOREIGN KEY (CommitteeID) REFERENCES Committee(CommitteeID),
  FOREIGN KEY (ItemID) REFERENCES Item(ItemID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE DiscussionMessage (
  DiscussionMessageID INT PRIMARY KEY AUTO_INCREMENT,
  DiscussionID INT NOT NULL,
  SenderID INT NOT NULL,
  Message VARCHAR(1024),
  Date DATETIME,
  FOREIGN KEY (DiscussionID) REFERENCES Discussion(DiscussionID),
  FOREIGN KEY (SenderID) REFERENCES Member(MemberID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE DiscussionVote (
  DiscussionVoteID INT PRIMARY KEY AUTO_INCREMENT,
  VoterID INT NOT NULL,
  DiscussionID INT NOT NULL,
  Vote BOOL,
  Date DATETIME,
  FOREIGN KEY (VoterID) REFERENCES Member(MemberID),
  FOREIGN KEY (DiscussionID) REFERENCES Discussion(DiscussionID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE PrivateMessage (
  PrivateMessageID INT PRIMARY KEY AUTO_INCREMENT,
  SenderID INT,
  ReceiverID INT NOT NULL,
  Date DATETIME,
  Message VARCHAR(2048),
  FOREIGN KEY (SenderID) REFERENCES Member(MemberID),
  FOREIGN KEY (ReceiverID) REFERENCES Member(MemberID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE MFAMatrix (
  MFAMatrixID INT PRIMARY KEY AUTO_INCREMENT,
  UserID INT NOT NULL,
  ExpiryDate DATETIME,
  CreationDate DATETIME,
  Matrix CHAR(25),
  FOREIGN KEY (UserID) REFERENCES Member(MemberID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DELIMITER $$
CREATE PROCEDURE process_due_plagiarism_vote()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE d_id INT;
  DECLARE d_item INT;
  DECLARE author_orcid CHAR(19);
  DECLARE author_member INT;
  DECLARE removed_count INT;
  DECLARE total_votes INT;
  DECLARE yes_votes INT;

  DECLARE cur CURSOR FOR
    SELECT DiscussionID, ItemID FROM Discussion
    WHERE CommitteeID = 1 AND VoteActive = TRUE AND VotingDeadline <= NOW();
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO d_id, d_item;
    IF done THEN LEAVE read_loop; END IF;

    SELECT COUNT(*) INTO total_votes FROM DiscussionVote WHERE DiscussionID = d_id;
    SELECT COUNT(*) INTO yes_votes FROM DiscussionVote WHERE DiscussionID = d_id AND Vote = TRUE;

    IF total_votes > 0 AND yes_votes * 3 >= total_votes * 2 THEN
      UPDATE Item SET Status = 'Removed' WHERE ItemID = d_item;

      SELECT AuthorID INTO author_orcid FROM Item WHERE ItemID = d_item;
      SELECT MemberID INTO author_member FROM Member WHERE ORCID = author_orcid LIMIT 1;

      IF author_member IS NOT NULL THEN
        INSERT INTO PrivateMessage (SenderID, ReceiverID, Date, Message)
          VALUES (NULL, author_member, NOW(),
            CONCAT('Your item "', (SELECT IFNULL(Title, 'Untitled') FROM Item WHERE ItemID = d_item), '" has been removed following a plagiarism committee vote.'));
      END IF;

      SELECT COUNT(*) INTO removed_count FROM Item WHERE AuthorID = author_orcid AND Status = 'Removed';

      IF removed_count >= 3 THEN
        UPDATE Member SET Blacklisted = TRUE WHERE ORCID = author_orcid;
        UPDATE Item SET Status = 'Removed' WHERE AuthorID = author_orcid;
      ELSE
        UPDATE Item
        SET Status = 'Under Review (Plagiarism)'
        WHERE AuthorID = author_orcid AND Status = 'Available' AND ItemID != d_item;
      END IF;
    END IF;

    UPDATE Discussion SET VoteActive = FALSE WHERE DiscussionID = d_id;
  END LOOP;
  CLOSE cur;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE process_due_appeal_vote()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE d_id INT;
  DECLARE d_item INT;
  DECLARE author_orcid CHAR(19);
  DECLARE author_member INT;
  DECLARE removed_count INT;
  DECLARE total_votes INT;
  DECLARE yes_votes INT;

  DECLARE cur CURSOR FOR
    SELECT DiscussionID, ItemID FROM Discussion
    WHERE CommitteeID = 2 AND VoteActive = TRUE AND VotingDeadline <= NOW();
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO d_id, d_item;
    IF done THEN LEAVE read_loop; END IF;

    SELECT COUNT(*) INTO total_votes FROM DiscussionVote WHERE DiscussionID = d_id;
    SELECT COUNT(*) INTO yes_votes FROM DiscussionVote WHERE DiscussionID = d_id AND Vote = TRUE;

    IF total_votes > 0 AND yes_votes * 2 > total_votes THEN
      UPDATE Item SET Status = 'Available' WHERE ItemID = d_item;

      SELECT AuthorID INTO author_orcid FROM Item WHERE ItemID = d_item;
      SELECT MemberID INTO author_member FROM Member WHERE ORCID = author_orcid LIMIT 1;

      IF author_member IS NOT NULL THEN
        INSERT INTO PrivateMessage (SenderID, ReceiverID, Date, Message)
          VALUES (NULL, author_member, NOW(),
            CONCAT('Your item "', (SELECT IFNULL(Title, 'Untitled') FROM Item WHERE ItemID = d_item), '" has been reinstated following an appeal committee vote.'));
      END IF;
    END IF;

    UPDATE Discussion SET VoteActive = FALSE WHERE DiscussionID = d_id;
  END LOOP;
  CLOSE cur;
END$$
DELIMITER ;

CREATE EVENT IF NOT EXISTS process_discussions_event
ON SCHEDULE EVERY 1 MINUTE
DO
  CALL process_due_plagiarism_vote();
  CALL process_due_appeal_vote();
