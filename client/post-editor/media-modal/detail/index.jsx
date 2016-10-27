/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { noop, partial } from 'lodash';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
var DetailItem = require( './detail-item' ),
	MediaUtils = require( 'lib/media/utils' ),
	HeaderCake = require( 'components/header-cake' ),
	EditorMediaModalDetailTitle = require( './detail-title' ),
	preloadImage = require( '../preload-image' );
import { ModalViews } from 'state/ui/media-modal/constants';
import { setEditorMediaModalView } from 'state/ui/editor/actions';

import { fetch } from 'lib/media/actions';

const EditorMediaModalDetail = React.createClass( {
	propTypes: {
		site: React.PropTypes.object,
		items: React.PropTypes.array,
		selectedIndex: React.PropTypes.number,
		onSelectedIndexChange: React.PropTypes.func,
		onReturnToList: React.PropTypes.func,
		onEdit: React.PropTypes.func,
		onRestore: React.PropTypes.func,
	},

	getDefaultProps: function() {
		return {
			selectedIndex: 0,
			onSelectedIndexChange: noop
		};
	},
	componentWillMount() {
		if ( this.props.site.jetpack ) {
			return null;
		}

		const { items, selectedIndex, site, } = this.props;
		const item = items[ selectedIndex ];

		// re-fetch the media post for non Jetpack sites
		// @TODO: clean this `hack` once media is reduxifid and/or media endpoints `1.2` are implemented in Jetpack plugin.
		if ( ! site.jetpack ) {
			fetch( site.ID, item.ID, { apiVersion: '1.2' } );
		}
	},

	componentDidMount: function() {
		this.preloadImages();
	},

	componentDidUpdate: function() {
		this.preloadImages();
	},

	preloadImages: function() {
		MediaUtils.filterItemsByMimePrefix( this.props.items, 'image' ).forEach( function( image ) {
			var src = MediaUtils.url( image, {
				photon: this.props.site && ! this.props.site.is_private
			} );

			preloadImage( src );
		}, this );
	},

	incrementIndex: function( increment ) {
		this.props.onSelectedIndexChange( this.props.selectedIndex + increment );
	},

	render: function() {
		const {
			items,
			selectedIndex,
			site,

			onEditItem,
			onRestoreItem,
			onImageItemLoad,
			onApplyRestoreItem,
			onDiscardRestoreItem,
			onReturnToList,
		} = this.props;

		const item = items[ selectedIndex ];

		return (
			<div className={ classNames(
				'editor-media-modal-detail',
				{ 'is-loading-original': item.loading_original },
				{ 'is-original-loaded': item.original_loaded },
			) }
			>
				<HeaderCake onClick={ onReturnToList } backText={ this.translate( 'Media Library' ) }>
					<EditorMediaModalDetailTitle
						site={ site }
						item={ items[ selectedIndex ] } />
				</HeaderCake>
				<DetailItem
					site={ site }
					item={ item }
					hasPreviousItem={ selectedIndex - 1 >= 0 }
					hasNextItem={ selectedIndex + 1 < items.length }
					onShowPreviousItem={ this.incrementIndex.bind( this, -1 ) }
					onShowNextItem={ this.incrementIndex.bind( this, 1 ) }
					onEdit={ onEditItem }
					onRestore={ onRestoreItem }
					onRestoreApply={ onApplyRestoreItem }
					onRestoreDiscard={ onDiscardRestoreItem }
					onImageLoad={ onImageItemLoad } />
			</div>
		);
	}
} );

export default connect( null, {
	onReturnToList: partial( setEditorMediaModalView, ModalViews.LIST ),
	onEditItem: partial( setEditorMediaModalView, ModalViews.IMAGE_EDITOR )
} )( EditorMediaModalDetail );
