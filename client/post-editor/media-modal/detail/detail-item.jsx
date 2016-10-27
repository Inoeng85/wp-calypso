/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import { noop } from 'lodash';
import debugFactory from 'debug';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import EditorMediaModalDetailFields from './detail-fields';
import EditorMediaModalDetailFileInfo from './detail-file-info';
import EditorMediaModalDetailPreviewImage from './detail-preview-image';
import EditorMediaModalDetailPreviewVideo from './detail-preview-video';
import EditorMediaModalDetailPreviewAudio from './detail-preview-audio';
import EditorMediaModalDetailPreviewDocument from './detail-preview-document';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import { userCan, isJetpack } from 'lib/site/utils';
import MediaUtils, { isItemBeingUploaded } from 'lib/media/utils';
import config from 'config';

const debug = debugFactory( 'calypso:post-editor:media:detail-item' );

class EditorMediaModalDetailItem extends Component {
	static propTypes = {
		site: PropTypes.object,
		item: PropTypes.object,
		hasPreviousItem: PropTypes.bool,
		hasNextItem: PropTypes.bool,
		onShowPreviousItem: PropTypes.func,
		onShowNextItem: PropTypes.func,
		onEdit: PropTypes.func,
		onImageLoad: PropTypes.func,
		onRestore: PropTypes.func,
		onRestoreApply: PropTypes.func,
	};

	static defaultProps = {
		hasPreviousItem: false,
		hasNextItem: false,
		onShowPreviousItem: noop,
		onShowNextItem: noop,
		onEdit: noop,
		onImageLoad: noop,
		onRestore: noop,
		onRestoreApply: noop,
	};

	renderEditButton() {
		const {
			item,
			onEdit,
			site,
			translate
		} = this.props;

		// Do not render edit button for private sites
		if ( site.is_private ) {
			debug( 'Do not show `Edit button` for private sites' );
			return null;
		}

		if (
			! config.isEnabled( 'post-editor/image-editor' ) ||
			! userCan( 'upload_files', site ) ||
			isJetpack( site ) ||
			! item
		) {
			return null;
		}

		const mimePrefix = MediaUtils.getMimePrefix( item );

		if ( 'image' !== mimePrefix ) {
			return null;
		}

		return (
			<Button
				className="editor-media-modal-detail__edit"
				onClick={ onEdit }
				disabled={ isItemBeingUploaded( item ) || item.original_loaded }
			>
				<Gridicon icon="pencil" size={ 36 } /> { translate( 'Edit Image' ) }
			</Button>
		);
	}

	renderRestoreButton() {
		const {
			item,
			onRestore,
			onRestoreApply,
			translate
		} = this.props;

		const isLoading = item.loading_original;
		const isReadyToRestore = item.original_loaded;

		const handleRestoringMethod = event => {
			if ( isReadyToRestore ) {
				return onRestoreApply( item, event );
			}

			return onRestore( item, event );
		};

		const buttonText = isReadyToRestore ? translate( 'Apply' ) : translate( 'Restore Original' );

		return (
			<Button
				className={ classNames(
					'editor-media-modal-detail__restore',
					{ 'is-loading': isLoading },
					{ 'is-ready': isReadyToRestore },
				) }
				disabled={ isLoading }
				onClick={ handleRestoringMethod }
			>
				<Gridicon
					icon={ isReadyToRestore ? 'checkmark' : 'refresh' }
					size={ 36 } />
					&nbsp;{ buttonText }
			</Button>
		);
	}

	renderDiscardRestoreButton() {
		const {
			item,
			onRestoreDiscard,
			translate
		} = this.props;

		const handleCancelRestoringMethod = event => {
			onRestoreDiscard( item, event );
		};

		return (
			<Button
				className="editor-media-modal-detail__cancel_restore"
				onClick={ handleCancelRestoringMethod }
			>
				<Gridicon icon="trash" size={ 36 } /> { translate( 'Discard' ) }
			</Button>
		);
	}

	renderEditionBar( item, classname = 'is-desktop' ) {
		const { site } = this.props;

		// Do not render edit button for private sites
		if ( site.is_private ) {
			debug( 'Do not show `Restore button` for private sites' );

			return null;
		}

		if (
			! config.isEnabled( 'post-editor/image-editor' ) ||
			isJetpack( site ) ||
			! item
		) {
			return null;
		}

		const hasOriginal = item.revision_history &&
			item.revision_history.original &&
			item.revision_history.original.URL;

		const originalWasLoaded = ! item.loading_original && item.original_loaded;

		const classes = classNames( 'editor-media-modal-detail__edition-bar', classname );

		return (
			<div className={ classes }>
				{ originalWasLoaded && this.renderDiscardRestoreButton( classname ) }
				{ hasOriginal && this.renderRestoreButton( classname ) }
				{ this.renderEditButton() }
			</div>
		);
	}

	renderFields() {
		const { site, item } = this.props;

		if ( ! userCan( 'upload_files', site ) ) {
			return null;
		}

		return (
			<EditorMediaModalDetailFields
				site={ site }
				item={ item } />
		);
	}

	renderPreviousItemButton() {
		const {
			hasPreviousItem,
			onShowPreviousItem,
			translate
		} = this.props;

		if ( ! hasPreviousItem ) {
			return null;
		}

		return (
			<button
				onClick={ onShowPreviousItem }
				className="editor-media-modal-detail__previous">
				<Gridicon icon="chevron-left" size={ 36 } />
				<span className="screen-reader-text">
					{ translate( 'Previous' ) }
				</span>
			</button>
		);
	}

	renderNextItemButton() {
		const {
			hasNextItem,
			onShowNextItem,
			translate
		} = this.props;

		if ( ! hasNextItem ) {
			return null;
		}

		return (
			<button
				onClick={ onShowNextItem }
				className="editor-media-modal-detail__next">
				<Gridicon icon="chevron-right" size={ 36 } />
				<span className="screen-reader-text">
					{ translate( 'Next' ) }
				</span>
			</button>
		);
	}

	renderItem() {
		const { item, site } = this.props;

		if ( ! item ) {
			return null;
		}

		const mimePrefix = MediaUtils.getMimePrefix( item );

		let Item;

		switch ( mimePrefix ) {
			case 'image': Item = EditorMediaModalDetailPreviewImage; break;
			case 'video': Item = EditorMediaModalDetailPreviewVideo; break;
			case 'audio': Item = EditorMediaModalDetailPreviewAudio; break;
			default: Item = EditorMediaModalDetailPreviewDocument; break;
		}

		const handleOnLoad = ( event ) => {
			this.props.onImageLoad( item, event );
		};

		return React.createElement( Item, {
			site: site,
			item: item,
			onLoad: handleOnLoad
		} );
	}

	render() {
		const { item } = this.props;

		const classes = classNames( 'editor-media-modal-detail__item', {
			'is-loading': ! item
		} );

		return (
			<figure className={ classes }>
				<div className="editor-media-modal-detail__content editor-media-modal__content">

					<div className="editor-media-modal-detail__preview-wrapper">
						{ this.renderItem() }
						{ this.renderEditionBar( item ) }
						{ this.renderPreviousItemButton() }
						{ this.renderNextItemButton() }
					</div>

					<div className="editor-media-modal-detail__sidebar">
						{ this.renderEditionBar( item, 'is-mobile' ) }
						{ this.renderFields() }
						<EditorMediaModalDetailFileInfo
							item={ item } />
					</div>

				</div>
			</figure>
		);
	}
}

export default localize( EditorMediaModalDetailItem );
