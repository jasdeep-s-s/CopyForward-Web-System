import React, { useEffect, useState } from 'react'
import './ItemPage.css'

function ItemPage ({ itemId }) {
	const [item, setItem] = useState(null)
	const [commentText, setCommentText] = useState('')
	const [replyToId, setReplyToId] = useState(null)
	const [replyToAuthor, setReplyToAuthor] = useState('')
	const [privateReply, setPrivateReply] = useState(false)
	const [canDownload, setCanDownload] = useState(null)
	const [downloadInfo, setDownloadInfo] = useState(null)
	const [hasActivePlagiarismDebate, setHasActivePlagiarismDebate] = useState(false)

	useEffect(() => {
		let cancelled = false

		async function load() {
			try {
				const res = await fetch(`/item.php?id=${encodeURIComponent(itemId)}`)
				if (!res.ok) throw new Error('Failed to fetch item')
				const data = await res.json()

				const itemData = {
					id: itemId,
					title: data.Title,
					author: data.Name,
					authorMemberId: data.AuthorMemberID || null,
					publicationDate: data.PublicationDate,
					uploadDate: data.UploadDate,
					updateDate: data.UpdateDate || data.UpdatedAt,
					topic: data.Topic,
					status: data.Status,
					versions: [],
					comments: []
				}

                // for versions
				let parentId = itemId
				let includeParent = false
				try {
					const pRes = await fetch(`/item_parent.php?id=${encodeURIComponent(itemId)}`)
					if (pRes.ok) {
						const pData = await pRes.json()
						if (pData && pData.ParentTitleID) {
							parentId = pData.ParentTitleID
							includeParent = true
						}
					}
				} catch {
					// ignore and use itemId as parent
				}
				try {
					const vRes = await fetch(`/versions.php?parent=${encodeURIComponent(parentId)}${includeParent ? '&includeParent=1' : ''}${includeParent ? `&exclude=${encodeURIComponent(itemId)}` : ''}`)
					if (vRes.ok) {
						const versions = await vRes.json()
						itemData.versions = (versions || []).map(v => ({ id: v.ItemID, label: v.Title, uploadDate: v.UploadDate }))
					}
				} catch {
					// leave versions empty
				}

				try {
					const logged = localStorage.getItem('logged_in_id')
					const viewerQuery = logged ? `&viewer=${encodeURIComponent(logged)}` : ''
					const cRes = await fetch(`/comments.php?item=${encodeURIComponent(itemId)}${viewerQuery}`)
					if (cRes.ok) {
						const comments = await cRes.json()
						itemData.comments = (comments || []).map(c => ({ id: c.CommentID, author: c.CommentorName || 'Unknown', text: c.Comment, date: c.Date, parentId: c.ParentCommentID, private: !!c.private, commentorId: c.CommentorID }))
					}

					if (logged) {
						try {
							const dRes = await fetch(`/can_download.php?member=${encodeURIComponent(logged)}`)
							if (dRes.ok) {
								const dData = await dRes.json()
								setCanDownload(!!dData.allowed)
								setDownloadInfo(dData)
							}
							} catch {
							// ignore
						}
					} else {
						setCanDownload(null)
						setDownloadInfo(null)
					}
				} catch {
					// leave comments empty
				}

				if (!cancelled) setItem(itemData)

				try {
					const aRes = await fetch(`/active_plagiarism_debate.php?item=${encodeURIComponent(itemId)}`)
					if (aRes.ok) {
						const aj = await aRes.json()
						if (!cancelled && aj && aj.success) setHasActivePlagiarismDebate(!!aj.active)
					}
				} catch (err) {}
			} catch (err) {
				console.error('Item fetch error:', err)
			}
		}

		load()
		return () => { cancelled = true }
	}, [itemId])

	function submitComment (e) {
		e.preventDefault()
		const text = commentText.trim()
		if (!text) return

		// require logged_in_id in localStorage
		const loggedId = localStorage.getItem('logged_in_id')
		if (!loggedId) {
			alert('You must be signed in to post comments.')
			return
		}

		const payload = {
			itemId: itemId,
			commentorId: parseInt(loggedId, 10),
			comment: text
		}
		if (replyToId) payload.parentId = replyToId
		if (replyToId && privateReply) payload.private = true

		fetch('/post_comment.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		})
		.then(r => r.json())
		.then(data => {
			if (data && data.success) {
				const loggedAfter = localStorage.getItem('logged_in_id')
				const viewerQueryAfter = loggedAfter ? `&viewer=${encodeURIComponent(loggedAfter)}` : ''
				fetch(`/comments.php?item=${encodeURIComponent(itemId)}${viewerQueryAfter}`)
					.then(r => r.json())
					.then(newComments => {
						setItem(prev => ({ ...prev, comments: (newComments || []).map(c => ({ id: c.CommentID, author: c.CommentorName || 'Unknown', text: c.Comment, date: c.Date, parentId: c.ParentCommentID, private: !!c.private, commentorId: c.CommentorID })) }))
					})
					.catch(() => {})
					setCommentText('')
					setReplyToId(null)
					setReplyToAuthor('')
					setPrivateReply(false)
			} else {
				alert('Failed to post comment')
			}
		})
		.catch(err => {
			console.error('post comment error', err)
			alert('Network error while posting comment')
		})
	}

	async function handleAppeal() {
		const logged = localStorage.getItem('logged_in_id')
		if (!logged) { alert('You must be signed in to appeal.'); return }
		const ok = window.confirm('Submit an appeal to the appeals committee?')
		if (!ok) return

		try {
			const res = await fetch('/appeal_item.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memberId: Number(logged), itemId: Number(item.id) })
			})
			const j = await res.json()
			if (j && j.success) {
				alert('Appeal submitted' + (j.discussionId ? ` (discussion ${j.discussionId})` : ''))
			} else {
				if (j && j.error === 'not_author') alert('Appeal not allowed: you are not verified as the author.')
				else if (j && j.error) alert('Failed to submit appeal: ' + j.error)
				else alert('Failed to submit appeal')
			}
		} catch (err) {
			console.error('appeal error', err)
			alert('Network error while submitting appeal')
		}
	}

	function handleDownload() {
		const logged = localStorage.getItem('logged_in_id')
		if (!logged) {
			alert('You must be signed in to download files.')
			return
		}
		if (canDownload === false) {
			const days = downloadInfo && downloadInfo.window_days ? downloadInfo.window_days : 7
			alert(`Downloads are limited: one download per ${days} day(s).`)
			return
		}

		fetch(`/download_item.php?item=${encodeURIComponent(item.id)}&member=${encodeURIComponent(logged)}&preview=1`)
			.then(r => r.json())
			.then(d => {
				if (d && d.allowed) {
					window.location.href = `/download_item.php?item=${encodeURIComponent(item.id)}&member=${encodeURIComponent(logged)}`
				} else {
					alert('You are not allowed to download right now.')
				}
			})
			.catch(err => {
				console.error('download preview error', err)
				alert('Network error while checking download eligibility')
			})
	}


	const reportSuccess = (did) => {
		alert('Report submitted' + (did ? ` (discussion ${did})` : ''))
	}

	async function handleReport () {
		const logged = localStorage.getItem('logged_in_id')
		if (!logged) { alert('You must be signed in to report an item.'); return }
		const ok = window.confirm('Report this item for plagiarism?')
		if (!ok) return

		try {
			const res = await fetch('/report_item.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memberId: Number(logged), itemId: Number(item.id) })
			})
			const j = await res.json()
			if (j && j.success) {
				reportSuccess(j.discussionId)
			} else {
				if (j && j.error === 'not_allowed') {
					console.debug('report suppressed: not_allowed')
				} else if (j && j.error) {
					alert('Failed to submit report: ' + j.error)
				} else {
					alert('Failed to submit report')
				}
			}
		} catch (err) {
			console.error('report error', err)
			alert('Network error while submitting report')
		}
	}

	if (!item) return <div className="item-page">Loading...</div>

	if (item.status === 'Removed') {
			const loggedId = localStorage.getItem('logged_in_id')
			const isAuthor = loggedId && item.authorMemberId && Number(loggedId) === Number(item.authorMemberId)

			return (
				<div className="item-page">
					<header className="item-header">
						<h1 className="item-title">This item has been removed</h1>
					</header>
					<div style={{ padding: 12 }}>
						{isAuthor ? (
							<div>
								<p>If you are the author and believe removal was incorrect, you may appeal to the appeals committee.</p>
								<div style={{ display: 'flex', gap: 8 }}>
									<button className="btn" onClick={handleAppeal}>Appeal</button>
									<button className="btn" onClick={() => { window.location.hash = `#/items/${item.id}/discussions` }}>Discussions</button>
								</div>
							</div>
						) : (
							<div>
								<p>This item has been removed.</p>
								<button className="btn" onClick={() => { window.location.hash = `#/items/${item.id}/discussions` }}>Discussions</button>
							</div>
						)}
					</div>
				</div>
			)
	}

	if (item.status === 'Under Review (Upload)') {
		return (
			<div className="item-page">
				<header className="item-header">
					<h1 className="item-title">This item hasn't been approved by a moderator yet.</h1>
				</header>
			</div>
		)
	}

	if (item.status === 'Deleted (Author)') {
		return (
			<div className="item-page">
				<header className="item-header">
					<h1 className="item-title">This item has been deleted by the author.</h1>
				</header>
			</div>
		)
	}

	return (
		<div className="item-page">
			<header className="item-header">
				<h1 className="item-title">{item.title}</h1>
				<div className="item-meta">
					<div>
						<strong>Author: </strong>
						{item.authorMemberId ? (
							<a className="version-link" href={`#/member/${item.authorMemberId}`} onClick={e => { e.preventDefault(); window.location.hash = `#/member/${item.authorMemberId}` }}>
								{item.author}
							</a>
						) : (
							item.author
						)}
					</div>
					<div><strong>Publication Date:</strong> {item.publicationDate}</div>
					<div><strong>Upload Date:</strong> {item.uploadDate}</div>
					<div><strong>Update Date:</strong> {item.updateDate}</div>
					<div><strong>Topic:</strong> {item.topic}</div>
					<div><strong>Status:</strong> {item.status}</div>
				</div>
			</header>

			<div className="item-actions">
				{localStorage.getItem('logged_in_id') ? (
					<button className="btn donate" onClick={() => { window.location.hash = `#/items/${item.id}/donate` }}>Donate</button>
				) : (
					<button className="btn donate" disabled title="Sign in to donate">Donate</button>
				)}
				{localStorage.getItem('logged_in_id') ? (
					<button
						className="btn download"
						onClick={handleDownload}
						disabled={canDownload === false}
						title={canDownload === false && downloadInfo ? `Download allowed once every ${downloadInfo.window_days} day(s).` : 'Download'}
					>
						Download
					</button>
				) : null}
				{localStorage.getItem('logged_in_id') ? (
					<button className="btn" onClick={() => { window.location.hash = `#/items/${item.id}/discussions` }}>Discussions</button>
				) : null}
				{localStorage.getItem('logged_in_id') && item.authorMemberId && Number(localStorage.getItem('logged_in_id')) === Number(item.authorMemberId) ? (
					<button className="btn delete" onClick={async () => {
						const ok = window.confirm('Delete this item?.')
						if (!ok) return
						const logged = Number(localStorage.getItem('logged_in_id'))
						try {
							const res = await fetch('/delete_item.php', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ memberId: logged, itemId: Number(item.id) })
							})
							const j = await res.json()
							if (j && j.success) {
								setItem(prev => ({ ...prev, status: 'Deleted (Author)' }))
								alert('Item marked Deleted')
							} else {
								if (j && j.error) alert('Failed to delete item: ' + j.error)
								else alert('Failed to delete item')
							}
						} catch (err) {
							console.error('delete item error', err)
							alert('Network error while deleting item')
						}
					}}>Delete</button>
				) : null}
				{localStorage.getItem('logged_in_id') && item.authorMemberId && Number(localStorage.getItem('logged_in_id')) === Number(item.authorMemberId) && hasActivePlagiarismDebate ? (
					<button className="btn" onClick={handleAppeal}>Appeal</button>
				) : null}
				<button className="btn report" onClick={handleReport}>Report</button>
			</div>

			<section className="versions">
				<h2>Other Versions</h2>
				{item.versions && item.versions.length ? (
					<ul className="versions-list">
						{item.versions.map(v => (
									<li key={v.id}>
										<a
											className="version-link"
											href={`#/items/${v.id}`}
											onClick={e => {
												// hash-based navigation
												e.preventDefault()
												window.location.hash = `#/items/${v.id}`
											}}
										>
											<span className="version-label">{v.label || `Version ${v.id}`}</span>
											{v.uploadDate ? (
												<span className="version-date"> - {v.uploadDate}</span>
											) : null}
										</a>
									</li>
								))}
					</ul>
				) : (
					<div className="empty">No other versions</div>
				)}
			</section>

			<section className="comments">
				<h2>Comments</h2>
				<form className="comment-form" onSubmit={submitComment}>
					{replyToId ? (
						<div style={{ marginBottom: 8 }}>
							<strong>Replying to:</strong> {replyToAuthor}
							<button type="button" style={{ marginLeft: 8 }} onClick={() => { setReplyToId(null); setReplyToAuthor(''); setPrivateReply(false) }}>Cancel</button>
						</div>
					) : null}
					{replyToId && item && item.authorMemberId && Number(localStorage.getItem('logged_in_id')) === Number(item.authorMemberId) ? (
						<div style={{ marginBottom: 8 }}>
							<label style={{ fontSize: '0.9rem' }}>
								<input type="checkbox" checked={privateReply} onChange={e => setPrivateReply(e.target.checked)} /> Private reply
							</label>
						</div>
					) : null}
					<textarea
						value={commentText}
						onChange={e => setCommentText(e.target.value)}
						placeholder="Write a comment..."
						rows={4}
					/>
					<div className="comment-form-actions">
						<button type="submit" className="btn post">Post comment</button>
					</div>
				</form>

				<div className="comments-list">
						{(item.comments || []).length ? (
							(() => {
								const byParent = {};
								const top = [];
								for (const c of (item.comments || [])) {
									const pid = c.parentId ? Number(c.parentId) : 0;
									if (pid === 0) top.push(c);
									else {
										if (!byParent[pid]) byParent[pid] = [];
										byParent[pid].push(c);
									}
								}
								top.sort((a,b)=> new Date(a.date) - new Date(b.date));
								return top.map(parent => (
									<div key={parent.id}>
										<div className="comment">
											<div className="comment-author">
												{parent.commentorId ? (
													<a
														className="version-link"
														href={`#/member/${parent.commentorId}`}
														onClick={e => { e.preventDefault(); window.location.hash = `#/member/${parent.commentorId}` }}
													>
														{parent.author}
													</a>
												) : (
													parent.author
												)}
												{parent.private ? <span className="private-label"> (Private)</span> : null}
											</div>
											<div className="comment-date">{parent.date}</div>
											<div className="comment-text">{parent.text}</div>
											<div style={{ marginTop: 6 }}>
												{ (localStorage.getItem('logged_in_id') && item.authorMemberId && Number(localStorage.getItem('logged_in_id')) === Number(item.authorMemberId)) ? (
													<button type="button" className="btn" onClick={() => { setReplyToId(parent.id); setReplyToAuthor(parent.author); }}>
														Reply
													</button>
												) : null }
											</div>
										</div>
										{(byParent[parent.id] || []).map(r => (
											<div className="comment comment-reply" key={r.id}>
												<div className="comment-author">
													{r.commentorId ? (
														<a
															className="version-link"
															href={`#/member/${r.commentorId}`}
															onClick={e => { e.preventDefault(); window.location.hash = `#/member/${r.commentorId}` }}
														>
															{r.author}
														</a>
													) : (
														r.author
													)}
													{r.private ? <span className="private-label"> (Private)</span> : null}
												</div>
												<div className="comment-date">{r.date}</div>
												<div className="comment-text">{r.text}</div>
											</div>
										))}
									</div>
								));
							})()
						) : (
							<div className="empty">No comments yet</div>
						)}
				</div>
			</section>
		</div>
	)
}

export default ItemPage
