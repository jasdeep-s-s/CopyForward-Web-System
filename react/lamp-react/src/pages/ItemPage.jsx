import React, { useEffect, useState } from 'react'
import './ItemPage.css'

function ItemPage ({ itemId }) {
	const [item, setItem] = useState(null)
	const [commentText, setCommentText] = useState('')

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

				if (!cancelled) setItem(itemData)
			} catch (err) {
				console.error('Item fetch error:', err)
			}
		}

		load()
		return () => { cancelled = true }
	}, [itemId])

	function submitComment () {
		// todo
        null;
	}

	if (!item) return <div className="item-page">Loading...</div>

	return (
		<div className="item-page">
			<header className="item-header">
				<h1 className="item-title">{item.title}</h1>
				<div className="item-meta">
					<div><strong>Author:</strong> {item.author}</div>
					<div><strong>Publication Date:</strong> {item.publicationDate}</div>
					<div><strong>Upload Date:</strong> {item.uploadDate}</div>
					<div><strong>Update Date:</strong> {item.updateDate}</div>
					<div><strong>Topic:</strong> {item.topic}</div>
					<div><strong>Status:</strong> {item.status}</div>
				</div>
			</header>

			<div className="item-actions">
				<button className="btn donate">Donate</button>
				<button className="btn download">Download</button>
				<button className="btn report">Report</button>
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
												<span className="version-date"> — {v.uploadDate}</span>
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
						(item.comments || []).map(c => (
							<div className="comment" key={c.id}>
								<div className="comment-author">{c.author}</div>
								<div className="comment-text">{c.text}</div>
							</div>
						))
					) : (
						<div className="empty">No comments yet</div>
					)}
				</div>
			</section>
		</div>
	)
}

export default ItemPage
