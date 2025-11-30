-- database_seed.sql
-- Seed data consistent with database_new.sql (ORCID CHAR(19), AuthorID CHAR(19), Matrix CHAR(25))

-- If using docker, uncomment to grant access:
-- GRANT ALL PRIVILEGES ON cfp.* TO 'docker'@'%';

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE MFAMatrix;
TRUNCATE TABLE PrivateMessage;
TRUNCATE TABLE DiscussionVote;
TRUNCATE TABLE DiscussionMessage;
TRUNCATE TABLE Discussion;
TRUNCATE TABLE MemberCommittee;
TRUNCATE TABLE Committee;
TRUNCATE TABLE Donation;
TRUNCATE TABLE ChildrenCharity;
TRUNCATE TABLE Download;
TRUNCATE TABLE Comment;
TRUNCATE TABLE Item;
TRUNCATE TABLE Member;
TRUNCATE TABLE Address;
 
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------
-- 1. ADDRESS
-- ----------------------------------------------------------
INSERT INTO Address (StreetNumber, StreetName, City, Country) VALUES
(123, 'Crescent Street', 'Montreal', 'Canada'),   -- AddressID = 1
(44,  'Sherbrooke Street', 'Montreal', 'Canada'), -- AddressID = 2
(90,  'Bishop Street', 'Toronto', 'Canada'),      -- AddressID = 3
(12,  'King Street', 'Toronto', 'Canada'),        -- AddressID = 4
(77,  'Queen Mary Road', 'Montreal', 'Canada');   -- AddressID = 5


-- ----------------------------------------------------------
-- 2. MEMBERS
-- ORCID is CHAR(19), we use real ORCID-like format dddd-dddd-dddd-dddd
-- ----------------------------------------------------------
INSERT INTO Member
(Role, Name, Username, Organization, AddressID, PrimaryEmail, RecoveryEmail, Password, ORCID, Blacklisted)
VALUES
-- MemberID 1: Author (Alice)
('Author',   'Alice Author',   'aliceA',  'Concordia University', 1,
 'alice@example.com', 'alice.recovery@example.com', 'pass123',
 '0000-0000-0000-0001', FALSE),

-- MemberID 2: Author (Bob)
('Author',   'Bob Brown',      'bobB',    'McGill University',    2,
 'bob@example.com',   'bob.recovery@example.com',   'pass123',
 '0000-0000-0000-0002', FALSE),

-- MemberID 3: Regular (Carol)
('Regular',  'Carol Clark',    'carolC',  'Independent',          3,
 'carol@example.com', 'carol.recovery@example.com', 'pass123',
 NULL, FALSE),

-- MemberID 4: Moderator (Mike)
('Moderator','Mike Moderator', 'mikeM',   'CFP Staff',            1,
 'mike@example.com',  'mike.recovery@example.com',  'pass123',
 NULL, FALSE),

-- MemberID 5: Author (Dana)
('Author',   'Dana Doe',       'danaD',   'UdeM',                 4,
 'dana@example.com',  'dana.recovery@example.com',  'pass123',
 '0000-0000-0000-0003', FALSE),

-- MemberID 6: Regular (Eric)
('Regular',  'Eric Evans',     'ericE',   'Student',              5,
 'eric@example.com',  'eric.recovery@example.com',  'pass123',
 NULL, FALSE);


-- ----------------------------------------------------------
-- 3. ITEMS
-- AuthorID CHAR(19) references Member(ORCID)
-- ----------------------------------------------------------
INSERT INTO Item
(AuthorID, Title, PublicationDate, UploadDate, ApprovedBy,
 Topic, Type, Status, ParentTitleID, Content, UpdatedAt)
VALUES
-- ItemID 1: Original article by Alice
('0000-0000-0000-0001',
 'Understanding AI Ethics',
 '2023-01-10 00:00:00', '2023-01-12 10:00:00', 4,
 'Artificial Intelligence', 'Article', 'Available', NULL,
 'Full content about AI ethics ...',
 '2023-02-01 09:00:00'),

-- ItemID 2: Thesis by Bob
('0000-0000-0000-0002',
 'Supply Chain Optimization',
 '2022-11-01 00:00:00', '2022-11-03 11:00:00', 4,
 'Supply Chain', 'Thesis', 'Available', NULL,
 'Thesis about optimizing supply chain networks ...',
 '2023-01-01 08:30:00'),

-- ItemID 3: Revised version of Alice's article (derived from Item 1)
('0000-0000-0000-0001',
 'Understanding AI Ethics - Revised',
 '2023-01-10 00:00:00', '2023-03-01 14:00:00', 4,
 'Artificial Intelligence', 'Article', 'Available', 1,
 'Updated version of the AI ethics paper ...',
 '2023-03-01 14:00:00'),

-- ItemID 4: Conference paper by Dana
('0000-0000-0000-0003',
 'Data Mining in Healthcare',
 '2023-05-15 00:00:00', '2023-05-18 09:00:00', 4,
 'Data Mining', 'Conference Paper', 'Available', NULL,
 'Paper on data mining in medical records ...',
 '2023-05-18 09:00:00'),

-- ItemID 5: Extended version of Dana's paper (derived from Item 4)
('0000-0000-0000-0003',
 'Data Mining in Healthcare - Extended',
 '2023-05-15 00:00:00', '2023-06-10 10:00:00', 4,
 'Data Mining', 'Conference Paper', 'Available', 4,
 'Extended experiments and analysis ...',
 '2023-06-10 10:00:00');


-- ----------------------------------------------------------
-- 4. COMMENTS
-- ----------------------------------------------------------
INSERT INTO Comment
(ItemID, CommentorID, Comment, Date, ParentCommentID, Private)
VALUES
-- CommentID 1: Carol on Item 1
(1, 3, 'Great article, very helpful!', '2023-02-15 10:30:00', NULL, FALSE),

-- CommentID 2: Alice replying to Carol
(1, 1, 'Thanks for the feedback!', '2023-02-16 09:00:00', 1, FALSE),

-- CommentID 3: Eric on Item 2
(2, 6, 'Your thesis is very clear and detailed.', '2023-01-05 14:00:00', NULL, FALSE),

-- CommentID 4: Carol on Item 4
(4, 3, 'Very interesting approach to patient data.', '2023-06-01 16:30:00', NULL, FALSE),

-- CommentID 5: Bob on Item 5
(5, 2, 'The extended version adds great value.', '2023-06-20 11:20:00', NULL, FALSE);


-- ----------------------------------------------------------
-- 5. DOWNLOADS
-- ----------------------------------------------------------
INSERT INTO Download (ItemID, DownloaderID, Date) VALUES
(1, 3, '2023-02-10 12:00:00'),
(1, 3, '2023-03-11 09:30:00'),
(2, 3, '2023-01-03 18:45:00'),
(2, 6, '2023-01-04 13:15:00'),
(4, 6, '2023-06-02 10:10:00'),
(5, 3, '2023-06-21 08:00:00');

-- ----------------------------------------------------------
-- 7. CHILDREN CHARITY
-- ----------------------------------------------------------
INSERT INTO ChildrenCharity (Name, Approved, SuggestedBy) VALUES
('Save the Children', TRUE,  NULL), -- ChildrenCharityID = 1
('UNICEF',            TRUE,  NULL), -- ChildrenCharityID = 2
('Kids Future Fund',  FALSE, 3);    -- ChildrenCharityID = 3 (suggested by Carol)


-- ----------------------------------------------------------
-- 8. DONATIONS
-- Respect:
--  CHECK (ChildrenCharityPercent >= 60)
--  CHECK (AuthorPercent + ChildrenCharityPercent + CFPPercent = 100)
-- ----------------------------------------------------------
INSERT INTO Donation
(DonatorID, ItemID, ChildrenCharityID, Amount,
 AuthorPercent, ChildrenCharityPercent, CFPPercent, Date)
VALUES
-- Carol donates for Alice's article
(3, 1, 1, 20,
 10, 80, 10, '2023-02-10 12:05:00'),

-- Eric donates for Bob's thesis
(6, 2, 2, 50,
 20, 60, 20, '2023-01-04 09:00:00'),

-- Carol donates for Dana's extended paper
(3, 5, 1, 30,
 15, 70, 15, '2023-06-22 15:30:00');


-- ----------------------------------------------------------
-- 9. COMMITTEES
-- ----------------------------------------------------------
INSERT INTO Committee (Name, Description) VALUES
('Plagiarism Committee', 'Handles plagiarism reviews and blacklist decisions'), -- CommitteeID = 1
('Appeal Committee',     'Handles appeals to plagiarism decisions');           -- CommitteeID = 2


-- ----------------------------------------------------------
-- 10. MEMBER ↔ COMMITTEE
-- ----------------------------------------------------------
INSERT INTO MemberCommittee (MemberID, CommitteeID) VALUES
(4, 1),  -- Mike (moderator) in Plagiarism Committee
(4, 2),  -- Mike in Appeal Committee
(5, 1);  -- Dana also in Plagiarism Committee


-- ----------------------------------------------------------
-- 11. DISCUSSIONS (plagiarism cases)
-- ----------------------------------------------------------
INSERT INTO Discussion
(CommitteeID, ItemID, Subject, VoteActive, VotingDeadline, Status)
VALUES
-- DiscussionID 1: Possible plagiarism in Bob's thesis
(1, 2, 'Possible plagiarism in Supply Chain thesis', TRUE,
 '2023-02-20 23:59:59', 'Open'),

-- DiscussionID 2: Review revised AI Ethics article
(1, 3, 'Review of revised AI Ethics article for similarity', TRUE,
 '2023-03-15 23:59:59', 'Open'),

-- DiscussionID 3: Appeal for plagiarism decision on Bob's thesis
(2, 2, 'Appeal on plagiarism decision for Supply Chain thesis', TRUE,
 '2023-04-10 23:59:59', 'Appeal');


-- ----------------------------------------------------------
-- 12. DISCUSSION MESSAGES
-- ----------------------------------------------------------
INSERT INTO DiscussionMessage
(DiscussionID, SenderID, Message, Date)
VALUES
-- Case 1
(1, 4, 'Initial similarity report triggered review.', '2023-02-10 10:00:00'),
(1, 2, 'I will provide my original drafts for verification.', '2023-02-11 11:30:00'),

-- Case 2
(2, 4, 'Revised article shows overlapping text with existing source.', '2023-03-05 09:15:00'),
(2, 1, 'Those sections are cited properly in the references.', '2023-03-06 14:45:00'),

-- Case 3
(3, 2, 'Submitting additional evidence for my appeal.', '2023-03-25 13:00:00'),
(3, 4, 'Appeal committee has received the new documents.', '2023-03-26 15:20:00');


-- ----------------------------------------------------------
-- 13. DISCUSSION VOTES
-- Vote is BOOL (0 = keep, 1 = blacklist) – your app can interpret it.
-- ----------------------------------------------------------
INSERT INTO DiscussionVote
(VoterID, DiscussionID, Vote, Date)
VALUES
(4, 1, 1, '2023-02-18 17:00:00'),  -- Mike votes to blacklist in Case 1
(4, 2, 0, '2023-03-10 16:30:00'),  -- Mike votes to keep in Case 2
(4, 3, 0, '2023-04-05 10:10:00');  -- Appeal decision: keep in Case 3


-- ----------------------------------------------------------
-- 14. PRIVATE MESSAGES
-- ----------------------------------------------------------
INSERT INTO PrivateMessage
(SenderID, ReceiverID, Date, Message)
VALUES
(1, 3, '2023-01-15 09:00:00', 'Thank you for reading my AI Ethics article!'),
(3, 1, '2023-01-16 10:30:00', 'It really helped me understand the topic better.'),
(2, 6, '2023-01-20 15:45:00', 'Glad my thesis was useful for your project!');


-- ----------------------------------------------------------
-- 15. MFA MATRIX
-- Matrix CHAR(25) – all strings are exactly 25 characters
-- All members have at least one MFA record.
-- ----------------------------------------------------------
INSERT INTO MFAMatrix
(UserID, ExpiryDate, CreationDate, Matrix)
VALUES
(1, '2024-12-31 23:59:59', '2024-01-01 00:00:00', 'AAAAAAAAAAAAAAAAAAAAAAAAA'),
(2, '2024-12-31 23:59:59', '2024-01-10 00:00:00', 'BBBBBBBBBBBBBBBBBBBBBBBBB'),
(3, '2024-12-31 23:59:59', '2024-02-01 00:00:00', 'CCCCCCCCCCCCCCCCCCCCCCCCC'),
(4, '2024-12-31 23:59:59', '2024-03-01 00:00:00', 'DDDDDDDDDDDDDDDDDDDDDDDDD'),
(5, '2024-12-31 23:59:59', '2024-04-01 00:00:00', 'EEEEEEEEEEEEEEEEEEEEEEEEE'),
(6, '2024-12-31 23:59:59', '2024-05-01 00:00:00', 'FFFFFFFFFFFFFFFFFFFFFFFFF');

-- End of database_seed.sql
