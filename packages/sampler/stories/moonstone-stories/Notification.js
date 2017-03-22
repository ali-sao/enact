import Notification, {NotificationBase} from '@enact/moonstone/Notification';
import Button from '@enact/moonstone/Button';
import React from 'react';
import {storiesOf, action} from '@kadira/storybook';
import {withKnobs, boolean, text} from '@kadira/storybook-addon-knobs';

Notification.propTypes = Object.assign({}, NotificationBase.propTypes, Notification.propTypes);
Notification.defaultProps = Object.assign({}, NotificationBase.defaultProps, Notification.defaultProps);
Notification.displayName = 'Notification';

storiesOf('Notification')
	.addDecorator(withKnobs)
	.addWithInfo(
		' ',
		'Basic usage of Notification',
		() => (
			<Notification
				open={boolean('open', true)}
				noAutoDismiss={boolean('noAutoDismiss', false)}
				onClose={action('onClose')}
			>
				<span>{text('message', 'Notification has content in it and can be very useful for organizing information for the user.')}</span>
				<buttons>
					<Button>Ok</Button>
					<Button>Nevermind</Button>
				</buttons>
			</Notification>
		));