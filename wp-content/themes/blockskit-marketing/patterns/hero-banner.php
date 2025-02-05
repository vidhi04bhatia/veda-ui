<?php
/**
 * Title: Hero Banner
 * Slug: blockskit-marketing/hero-banner
 * Categories: all, banner
 * Keywords: hero banner
 */
$blockskit_marketing_images = array(
    '1' => BLOCKSKIT_MARKETING_URL . 'assets/images/banner-img1.png',
    '2' => BLOCKSKIT_MARKETING_URL . 'assets/images/banner-img2.jpg',
    '3' => BLOCKSKIT_MARKETING_URL . 'assets/images/banner-img3.jpg',
);
?>

<!-- wp:group {"align":"full","style":{"background":{"backgroundSize":"auto","backgroundPosition":"50% 100%","backgroundRepeat":"no-repeat","backgroundImage":{"url":"<?php echo esc_url($blockskit_marketing_images[1]); ?>","id":111,"source":"file","title":"banner-img1"}},"spacing":{"padding":{"top":"var:preset|spacing|xx-large","bottom":"0"}}},"backgroundColor":"primary","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-primary-background-color has-background" style="padding-top:var(--wp--preset--spacing--xx-large);padding-bottom:0"><!-- wp:columns {"style":{"spacing":{"padding":{"top":"var:preset|spacing|x-large","bottom":"var:preset|spacing|xx-large"},"blockGap":{"top":"var:preset|spacing|x-large","left":"var:preset|spacing|xx-large"}}}} -->
<div class="wp-block-columns" style="padding-top:var(--wp--preset--spacing--x-large);padding-bottom:var(--wp--preset--spacing--xx-large)"><!-- wp:column {"width":"50%"} -->
<div class="wp-block-column" style="flex-basis:50%"><!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:image {"id":83,"scale":"cover","sizeSlug":"full","linkDestination":"none","style":{"border":{"radius":"200px"},"layout":{"selfStretch":"fixed","flexSize":"60%"}}} -->
<figure class="wp-block-image size-full has-custom-border"><img src="<?php echo esc_url($blockskit_marketing_images[2]); ?>" alt="" class="wp-image-83" style="border-radius:200px;object-fit:cover"/></figure>
<!-- /wp:image -->

<!-- wp:image {"id":85,"scale":"cover","sizeSlug":"full","linkDestination":"none","style":{"border":{"radius":"200px"},"layout":{"selfStretch":"fixed","flexSize":"40%"}}} -->
<figure class="wp-block-image size-full has-custom-border"><img src="<?php echo esc_url($blockskit_marketing_images[3]); ?>" alt="" class="wp-image-85" style="border-radius:200px;object-fit:cover"/></figure>
<!-- /wp:image --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center","width":"50%","style":{"spacing":{"blockGap":"var:preset|spacing|medium"}}} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:50%"><!-- wp:heading {"textAlign":"left","level":1,"style":{"typography":{"fontStyle":"normal","fontWeight":"700","lineHeight":"1"},"elements":{"link":{"color":{"text":"var:preset|color|pure-white"}}}},"textColor":"pure-white"} -->
<h1 class="wp-block-heading has-text-align-left has-pure-white-color has-text-color has-link-color" style="font-style:normal;font-weight:700;line-height:1"><?php esc_html_e( 'Best Solution ', 'blockskit-marketing' ); ?><mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-highlight-color"><?php esc_html_e( 'Marketing', 'blockskit-marketing' ); ?></mark><mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-secondary-color"> </mark><?php esc_html_e( 'Firm.', 'blockskit-marketing' ); ?></h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"style":{"elements":{"link":{"color":{"text":"var:preset|color|light"}}}},"textColor":"light"} -->
<p class="has-light-color has-text-color has-link-color"><?php esc_html_e( 'Mauris elementum eu lorem placerat pede, maecenas perspiciatis fames. Commodo vel pharetra ullamcorper, sociis porro quam deleniti. Corrupti illum aliquid veritatis egestas, ipsa loream.', 'blockskit-marketing' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|small","margin":{"top":"var:preset|spacing|large"}}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"left"}} -->
<div class="wp-block-group" style="margin-top:var(--wp--preset--spacing--large)"><!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"style":{"border":{"radius":"30px"},"spacing":{"padding":{"left":"var:preset|spacing|medium","right":"var:preset|spacing|medium","top":"var:preset|spacing|x-small","bottom":"var:preset|spacing|x-small"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" style="border-radius:30px;padding-top:var(--wp--preset--spacing--x-small);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--x-small);padding-left:var(--wp--preset--spacing--medium)"><?php esc_html_e( 'GET STARTED', 'blockskit-marketing' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"className":"is-style-bk-button-secondary","style":{"border":{"radius":"30px"},"spacing":{"padding":{"left":"var:preset|spacing|medium","right":"var:preset|spacing|medium","top":"var:preset|spacing|x-small","bottom":"var:preset|spacing|x-small"}}}} -->
<div class="wp-block-button is-style-bk-button-secondary"><a class="wp-block-button__link wp-element-button" style="border-radius:30px;padding-top:var(--wp--preset--spacing--x-small);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--x-small);padding-left:var(--wp--preset--spacing--medium)"><?php esc_html_e( 'LEARN MORE', 'blockskit-marketing' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->