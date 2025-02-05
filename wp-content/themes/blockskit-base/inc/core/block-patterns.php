<?php
/**
 * Block Patterns
 *
 * @since 1.0.0
 */

/**
 * Registers pattern categories for Blockskit Base
 *
 * @since 1.0.0
 *
 * @return void
 */
function blockskit_base_register_pattern_category() {
	$block_pattern_categories = array(
		'all'      => array( 'label' => __( 'Blockskit Base Patterns', 'blockskit-base' ) ),
		'home'     => array( 'label' => __( 'Home', 'blockskit-base' ) ),
		'services' => array( 'label' => __( 'Services', 'blockskit-base' ) ),
		'clients'  => array( 'label' => __( 'Clients', 'blockskit-base' ) ),
		'pricing'  => array( 'label' => __( 'Pricing', 'blockskit-base' ) ),
		'callback' => array( 'label' => __( 'Call to Action', 'blockskit-base' ) ),
	);

	$block_pattern_categories = apply_filters( 'blockskit_base_block_pattern_categories', $block_pattern_categories );

	foreach ( $block_pattern_categories as $name => $properties ) {
		if ( ! WP_Block_Pattern_Categories_Registry::get_instance()->is_registered( $name ) ) {
			register_block_pattern_category( $name, $properties ); // phpcs:ignore WPThemeReview.PluginTerritory.ForbiddenFunctions.editor_blocks_register_block_pattern_category
		}		
	}
}
add_action( 'init', 'blockskit_base_register_pattern_category', 9 );


