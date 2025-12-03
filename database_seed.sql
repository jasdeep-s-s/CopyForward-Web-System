-- database_seed.sql
-- Seed data consistent with database_new.sql (ORCID CHAR(19), AuthorID CHAR(19), Matrix CHAR(25))

-- If using docker, uncomment to grant access:
-- GRANT ALL PRIVILEGES ON ovc353_2.* TO 'docker'@'%';
-- By Elhadji Moussa Diongue

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
-- 1. ADDRESS (15 rows, ASCII-only)
-- ----------------------------------------------------------
INSERT INTO Address (StreetNumber, StreetName, City, Country) VALUES
(123, 'Crescent Street',           'Montreal', 'Canada'),  -- 1
(44,  'Sherbrooke Street',         'Montreal', 'Canada'),  -- 2
(90,  'Bishop Street',             'Toronto',  'Canada'),  -- 3
(12,  'King Street',               'Toronto',  'Canada'),  -- 4
(77,  'Queen Mary Road',           'Montreal', 'Canada'),  -- 5
(15,  'Peel Street',               'Montreal', 'Canada'),  -- 6
(101, 'College Street',            'Toronto',  'Canada'),  -- 7
(250, 'Granville Street',          'Vancouver','Canada'),  -- 8
(88,  'Saint Laurent Boulevard',   'Montreal', 'Canada'),  -- 9
(60,  'De Maisonneuve Boulevard',  'Montreal', 'Canada'),  -- 10
(300, 'Bloor Street',              'Toronto',  'Canada'),  -- 11
(1,   'Place Ville-Marie',         'Montreal', 'Canada'),  -- 12
(55,  'Avenida Libertador',        'Santiago', 'Chile'),   -- 13
(18,  'Adeola Odeku Street',       'Lagos',    'Nigeria'), -- 14
(200, 'Yonge Street',              'Toronto',  'Canada');  -- 15


-- ----------------------------------------------------------
-- 2. MEMBERS (15 rows, ASCII-only)
-- ----------------------------------------------------------
INSERT INTO Member
(Role, Name, Username, Organization, AddressID,
 PrimaryEmail, RecoveryEmail, Password, ORCID, Blacklisted)
VALUES
('Author',   'Alice Author',        'aliceA',   'Concordia University', 1,
 'alice@example.com',  'alice.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 '0000-0000-0000-0001', FALSE),

('Author',   'Bob Brown',           'bobB',     'McGill University',    2,
 'bob@example.com',   'bob.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 '0000-0000-0000-0002', FALSE),

('Regular',  'Carol Clark',         'carolC',   'Independent',          3,
 'carol@example.com', 'carol.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 NULL, FALSE),

('Moderator','Mike Moderator',      'mikeM',    'CFP Staff',            4,
 'mike@example.com',  'mike.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 NULL, FALSE),

('Author',   'Dana Doe',            'danaD',    'UdeM',                 5,
 'dana@example.com',  'dana.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 '0000-0000-0000-0003', FALSE),

('Regular',  'Eric Evans',          'ericE',    'Student',              6,
 'eric@example.com',  'eric.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 NULL, FALSE),

('Author',   'Fatima Khan',         'fatimaK',  'University of Toronto',7,
 'fatima@example.com','fatima.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 '0000-0000-0000-0004', FALSE),

('Author',   'George Li',           'georgeL',  'UBC',                  8,
 'george@example.com','george.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 '0000-0000-0000-0005', FALSE),

('Regular',  'Hannah Lee',          'hannahL',  'Student',              9,
 'hannah@example.com','hannah.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 NULL, FALSE),

('Author',   'Ivan Petrov',         'ivanP',    'Polytechnique',        10,
 'ivan@example.com',  'ivan.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 '0000-0000-0000-0006', FALSE),

('Regular',  'Julia Smith',         'juliaS',   'Independent',          11,
 'julia@example.com', 'julia.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 NULL, FALSE),

('Moderator','Karen Admin',         'karenA',   'CFP Staff',            12,
 'karen@example.com','karen.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 NULL, FALSE),

('Author',   'Luis Fernandez',      'luisF',    'Universidad de Chile', 13,
 'luis@example.com','luis.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 '0000-0000-0000-0007', FALSE),

('Author',   'Mina Okafor',         'minaO',    'University of Lagos',  14,
 'mina@example.com','mina.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 '0000-0000-0000-0008', FALSE),

('Regular',  'Noah Johnson',        'noahJ',    'Student',              15,
 'noah@example.com','noah.recovery@example.com',
 '$2y$12$yJ1gi2ylq2Peng7pdegvyeSr8B1xqUVonfGBr/6aXEQhgWShQH9fG',
 NULL, FALSE);


INSERT INTO Item
(AuthorID, Title, PublicationDate, UploadDate, ApprovedBy,
 Topic, Type, Status, ParentTitleID, Content, UpdatedAt)
VALUES
('0000-0000-0000-0001',
 'Understanding AI Ethics',
 '2023-01-10 00:00:00','2023-01-12 10:00:00', 4,
 'Artificial Intelligence','Article','Available', NULL,
 'Full content about AI ethics.',
 '2023-02-01 09:00:00'),

('0000-0000-0000-0002',
 'Supply Chain Optimization',
 '2022-11-01 00:00:00','2022-11-03 11:00:00', 4,
 'Supply Chain','Thesis','Available', NULL,
 'Thesis about optimizing supply chain networks.',
 '2023-01-01 08:30:00'),

('0000-0000-0000-0001',
 'Understanding AI Ethics - Revised',
 '2023-01-10 00:00:00','2023-03-01 14:00:00', 4,
 'Artificial Intelligence','Article','Available', 1,
 'Revised version of AI ethics paper.',
 '2023-03-01 14:00:00'),

('0000-0000-0000-0003',
 'Data Mining in Healthcare',
 '2023-05-15 00:00:00','2023-05-18 09:00:00', 4,
 'Data Mining','Conference Paper','Available', NULL,
 'Conference paper about data mining in medical records.',
 '2023-05-18 09:00:00'),

('0000-0000-0000-0003',
 'Data Mining in Healthcare - Extended',
 '2023-05-15 00:00:00','2023-06-10 10:00:00', 4,
 'Data Mining','Conference Paper','Available', 4,
 'Extended version with more experiments.',
 '2023-06-10 10:00:00'),

('0000-0000-0000-0001',
 'AI Ethics Draft Version',
 '2023-01-05 00:00:00','2023-01-05 09:00:00', NULL,
 'Artificial Intelligence','Article','Under Review (Upload)', NULL,
 'Initial draft version pending review.',
 '2023-01-05 09:00:00'),

('0000-0000-0000-0002',
 'Old Supply Chain Paper Archived',
 '2020-03-01 00:00:00','2020-03-05 10:00:00', 4,
 'Supply Chain','Conference Paper','Removed', NULL,
 'Item archived and no longer visible to users.',
 '2021-01-01 00:00:00'),

('0000-0000-0000-0004',
 'Climate Change Impacts on Urban Mobility',
 '2023-04-10 00:00:00','2023-04-12 09:00:00', 4,
 'Transportation','Article','Available', NULL,
 'Study on climate change and transit usage.',
 '2023-04-20 08:00:00'),

('0000-0000-0000-0005',
 'Deep Learning for Medical Imaging',
 '2023-02-01 00:00:00','2023-02-02 11:30:00', 12,
 'Medical Imaging','Non-Thesis Graduate Project','Available', NULL,
 'Applying deep learning to MRI scans.',
 '2023-02-10 10:00:00'),

('0000-0000-0000-0006',
 'Robotics in Warehouse Automation',
 '2023-03-01 00:00:00','2023-03-05 13:00:00', 4,
 'Robotics','Thesis','Under Review (Plagiarism)', NULL,
 'Thesis on robotic warehouse automation.',
 '2023-03-20 09:30:00'),

('0000-0000-0000-0007',
 'Microfinance and Poverty Reduction',
 '2022-09-15 00:00:00','2022-09-20 10:00:00', 12,
 'Economics','Article','Available', NULL,
 'Microfinance impact study.',
 '2022-10-01 14:00:00'),

('0000-0000-0000-0008',
 'Educational Technology in Remote Learning',
 '2021-08-01 00:00:00','2021-08-10 09:00:00', 12,
 'Education','Monograph Chapter','Available', NULL,
 'Chapter on remote learning technologies.',
 '2021-09-01 12:00:00'),

('0000-0000-0000-0004',
 'Public Transit Optimization Dataset',
 '2023-04-10 00:00:00','2023-05-01 10:00:00', 4,
 'Transportation','Dataset','Available', 8,
 'Dataset on transit optimization.',
 '2023-05-01 10:00:00'),

('0000-0000-0000-0005',
 'AI for Climate Risk Assessment',
 '2023-06-01 00:00:00','2023-06-05 11:00:00', 4,
 'Climate Science','Conference Paper','Available', NULL,
 'Machine learning for climate risk.',
 '2023-06-05 11:00:00'),

('0000-0000-0000-0003',
 'Healthcare Records Anonymized Dataset',
 '2023-05-15 00:00:00','2023-07-01 08:30:00', 12,
 'Data Mining','Dataset','Available', 4,
 'Anonymized patient records dataset.',
 '2023-07-01 08:30:00');
-- ----------------------------------------------------------
-- 4. COMMENTS (clean ASCII content)
-- ----------------------------------------------------------
INSERT INTO Comment
(ItemID, CommentorID, Comment, Date, ParentCommentID, Private)
VALUES
(1, 3, 'Great article, very clear and useful.', '2023-02-15 10:30:00', NULL, 0),
(1, 1, 'Thank you for the feedback.', '2023-02-16 09:00:00', 1, 0),
(2, 6, 'Your thesis organization is excellent.', '2023-01-05 14:00:00', NULL, 0),
(4, 3, 'Interesting approach to patient data.', '2023-06-01 16:30:00', NULL, 0),
(5, 2, 'The extended version is very helpful.', '2023-06-20 11:20:00', NULL, 0),
(9, 10, 'Strong work on MRI imaging.', '2023-03-01 11:00:00', NULL, 0),
(11, 14, 'This paper helped my research.', '2023-02-10 12:30:00', NULL, 0),
(12, 7, 'Helpful chapter for remote teaching.', '2022-01-02 09:15:00', NULL, 0),
(14, 8, 'Dataset looks well structured.', '2023-05-03 12:00:00', NULL, 0),
(3, 9, 'The revised version is easier to read.', '2023-03-05 14:00:00', NULL, 0);


-- ----------------------------------------------------------
-- 5. DOWNLOADS
-- ----------------------------------------------------------
INSERT INTO Download (ItemID, DownloaderID, Date) VALUES
(1, 3, '2023-02-10 12:00:00'),
(1, 3, '2023-03-11 09:30:00'),
(2, 3, '2023-01-03 18:45:00'),
(2, 6, '2023-01-04 13:15:00'),
(4, 6, '2023-06-02 10:10:00'),
(5, 3, '2023-06-21 08:00:00'),
(9, 10, '2023-04-01 10:00:00'),
(12, 7, '2022-01-03 11:00:00'),
(14, 8, '2023-05-03 15:30:00'),
(15, 13, '2023-06-10 09:20:00');


-- ----------------------------------------------------------
-- 6. CHILDREN CHARITY
-- ----------------------------------------------------------
INSERT INTO ChildrenCharity (Name, Approved, SuggestedBy) VALUES
('Save the Children', TRUE,  NULL),
('UNICEF',            TRUE,  NULL),
('Kids Future Fund',  FALSE, 3);


-- ----------------------------------------------------------
-- 7. DONATIONS
-- Must respect:
-- ChildrenCharityPercent >= 60
-- AuthorPercent + ChildrenCharityPercent + CFPPercent = 100
-- ----------------------------------------------------------
INSERT INTO Donation
(DonatorID, ItemID, ChildrenCharityID, Amount,
 AuthorPercent, ChildrenCharityPercent, CFPPercent, Date)
VALUES
(3, 1, 1, 20, 10, 80, 10, '2023-02-10 12:05:00'),
(6, 2, 2, 50, 20, 60, 20, '2023-01-04 09:00:00'),
(3, 5, 1, 30, 15, 70, 15, '2023-06-22 15:30:00'),
(9, 11, 2, 15, 10, 70, 20, '2023-02-15 10:15:00'),
(13, 14, 1, 40, 20, 60, 20, '2023-05-10 14:00:00');


-- ----------------------------------------------------------
-- 8. COMMITTEES
-- ----------------------------------------------------------
INSERT INTO Committee (Name, Description) VALUES
('Plagiarism Committee', 'Reviews plagiarism reports and removal decisions'),
('Appeal Committee',     'Handles appeals after plagiarism decisions'),
('Ethics Committee',     'Reviews ethical concerns with research submissions');


-- ----------------------------------------------------------
-- 9. MEMBER COMMITTEE MEMBERSHIP
-- Moderators only
-- ----------------------------------------------------------
INSERT INTO MemberCommittee (MemberID, CommitteeID, Approved) VALUES
(4, 1, 1),  -- Mike in Plagiarism Committee
(4, 2, 1),  -- Mike in Appeal Committee
(12,1, 1),  -- Karen in Plagiarism Committee
(12,2, 1),  -- Karen in Appeal Committee
(12,3, 1);  -- Karen in Ethics Committee


-- ----------------------------------------------------------
-- 10. DISCUSSIONS
-- ----------------------------------------------------------
INSERT INTO Discussion
(CommitteeID, ItemID, Subject, VoteActive, VotingDeadline, Status)
VALUES
(1, 2,  'Possible plagiarism in Supply Chain thesis', TRUE, '2023-02-20 23:59:59', 'Open'),
(1, 3,  'Review of revised AI Ethics article', TRUE, '2023-03-15 23:59:59', 'Open'),
(2, 2,  'Appeal regarding plagiarism decision for Supply Chain thesis', TRUE, '2023-04-10 23:59:59', 'Appeal'),
(3, 9,  'Ethical review of medical imaging project', TRUE, '2023-03-01 23:59:59', 'Open'),
(3, 14, 'Ethics review for transit dataset', TRUE, '2023-05-10 23:59:59', 'Open');


-- ----------------------------------------------------------
-- 11. DISCUSSION MESSAGES
-- ----------------------------------------------------------
INSERT INTO DiscussionMessage
(DiscussionID, SenderID, Message, Date)
VALUES
(1, 4, 'Initial similarity report triggered review.', '2023-02-10 10:00:00'),
(1, 2, 'I will provide drafts for verification.', '2023-02-11 11:30:00'),
(2, 4, 'The revised article has overlapping text segments.', '2023-03-05 09:15:00'),
(2, 1, 'Those sections are properly cited.', '2023-03-06 14:45:00'),
(3, 2, 'Submitting evidence for appeal.', '2023-03-25 13:00:00'),
(3, 4, 'Appeal documents received.', '2023-03-26 15:20:00'),
(4, 12, 'Ethical concerns about data handling.', '2023-02-20 09:00:00'),
(5, 12, 'Committee reviewing dataset anonymity.', '2023-04-30 10:00:00');


-- ----------------------------------------------------------
-- 12. DISCUSSION VOTES
-- ----------------------------------------------------------
INSERT INTO DiscussionVote
(VoterID, DiscussionID, Vote, Date)
VALUES
(4, 1, 1, '2023-02-18 17:00:00'),
(12,1, 1, '2023-02-19 09:00:00'),
(4, 2, 0, '2023-03-10 16:30:00'),
(12,2, 0, '2023-03-11 10:30:00'),
(4, 3, 0, '2023-04-05 10:10:00'),
(12,3, 0, '2023-04-06 11:00:00'),
(4, 4, 1, '2023-02-25 15:00:00'),
(12,4, 1, '2023-02-26 09:45:00'),
(4, 5, 0, '2023-05-05 12:00:00'),
(12,5, 0, '2023-05-06 13:00:00');


-- ----------------------------------------------------------
-- 13. PRIVATE MESSAGES
-- ----------------------------------------------------------
INSERT INTO PrivateMessage
(SenderID, ReceiverID, Date, Message)
VALUES
(1, 3, '2023-01-15 09:00:00', 'Thank you for reading my AI ethics article.'),
(3, 1, '2023-01-16 10:30:00', 'Your article was very helpful for my research.'),
(2, 6, '2023-01-20 15:45:00', 'Glad my thesis was useful for your project.'),
(12,5, '2023-04-01 08:00:00', 'Your item is scheduled for committee review.'),
(4, 7, '2023-02-01 14:00:00', 'Please revise your submission before approval.');


-- ----------------------------------------------------------
-- 14. MFA MATRIX (all 15 members)
-- ----------------------------------------------------------
INSERT INTO MFAMatrix
(UserID, ExpiryDate, CreationDate, Matrix, recentlyUpdated)
VALUES
(1, '2025-12-31 23:59:59','2024-01-01 00:00:00','AAAAAAAAAAAAAAAAAAAAAAAAA', 0),
(2, '2025-12-31 23:59:59','2024-01-10 00:00:00','BBBBBBBBBBBBBBBBBBBBBBBBB', 0),
(3, '2025-12-31 23:59:59','2024-02-01 00:00:00','CCCCCCCCCCCCCCCCCCCCCCCCC', 0),
(4, '2025-12-31 23:59:59','2024-03-01 00:00:00','DDDDDDDDDDDDDDDDDDDDDDDDD', 0),
(5, '2025-12-31 23:59:59','2024-04-01 00:00:00','EEEEEEEEEEEEEEEEEEEEEEEEE', 0),
(6, '2025-12-31 23:59:59','2024-05-01 00:00:00','FFFFFFFFFFFFFFFFFFFFFFFFF', 0),
(7, '2025-12-31 23:59:59','2024-06-01 00:00:00','GGGGGGGGGGGGGGGGGGGGGGGGG', 0),
(8, '2025-12-31 23:59:59','2024-07-01 00:00:00','HHHHHHHHHHHHHHHHHHHHHHHHH', 0),
(9, '2025-12-31 23:59:59','2024-08-01 00:00:00','IIIIIIIIIIIIIIIIIIIIIIIII', 0),
(10,'2025-12-31 23:59:59','2024-09-01 00:00:00','JJJJJJJJJJJJJJJJJJJJJJJJJ', 0),
(11,'2025-12-31 23:59:59','2024-10-01 00:00:00','KKKKKKKKKKKKKKKKKKKKKKKKK', 0),
(12,'2025-12-31 23:59:59','2024-11-01 00:00:00','LLLLLLLLLLLLLLLLLLLLLLLLL', 1),
(13,'2025-12-31 23:59:59','2024-12-01 00:00:00','MMMMMMMMMMMMMMMMMMMMMMMMM', 1),
(14,'2025-12-31 23:59:59','2024-12-15 00:00:00','NNNNNNNNNNNNNNNNNNNNNNNNN', 0),
(15,'2025-12-31 23:59:59','2024-12-20 00:00:00','OOOOOOOOOOOOOOOOOOOOOOOOO', 0);

-- END OF SEED FILE