import hoc from '@enact/core/hoc';
import React from 'react';
import PropTypes from 'prop-types';

import {createResBundle, getResBundle} from '../src/resBundle';
import ilib from '../ilib/lib/ilib';
import IString from '../ilib/lib/IString';
import {I18nContextDecorator} from '../I18nDecorator';

function getIStringFromBundle (rb, str) {
	const isObject = typeof str === 'object';
	if (rb) {
		return isObject ? rb.getString(str.value, str.key) : rb.getString(str);
	}

	return new IString(isObject ? str.value : str);
}

function getTextMap (mapPropsToText, props) {
	const {children, defaultText} = props;

	if (mapPropsToText) {
		return Object.keys(mapPropsToText).reduce((result, prop) => {
			const text = mapPropsToText[prop];

			// if a prop is specified without a proper value (string or object), ignore it
			if (text) {
				if (typeof text === 'string') {
					// for string text values, pass them along as the untranslated text
					// without a default value
					result[prop] = {translated: false, text, defaultText: false};
				} else if (typeof text.text === 'string') {
					// for object text values with a string text member, use it as the
					// untranslated text and optionally look for a string defaultText for a
					// default value
					result[prop] = {
						translated: false,
						text: text.text,
						defaultText: typeof text.defaultText === 'string' ?
							text.defaultText :
							false
					};
				}
			}

			return result;
		}, {});
	} else if (typeof children === 'string') {
		return {
			children: {
				translated: false,
				text: children,
				defaultText
			}
		};
	}
}

const STRING_ONLY = '~~Text~~';

const defaultConfig = {
	mapPropsToText: null
};

const TextDecorator = hoc(defaultConfig, (config, Wrapped) => {
	const {mapPropsToText} = config;

	const Decorator = class extends React.Component {
		static displayName = 'TextDecorator'

		static propTypes = {
			locale: PropTypes.string
		}

		constructor (props) {
			super(props);

			this.state = {
				map: getTextMap(mapPropsToText, props)
			};
		}

		componentDidMount () {
			if (this.shouldTranslate()) {
				this.translate(this.props.locale);
			}
		}

		componentWillReceiveProps (nextProps) {
			if (this.props.locale !== nextProps.locale) {
				this.translate(nextProps.locale);
			}
		}

		shouldTranslate () {
			return mapPropsToText || typeof this.props.children === 'string';
		}

		translate (locale = ilib.getLocale()) {
			const {map} = this.state;
			const bundle = getResBundle();

			if (!map) return;

			const props = Object.keys(map);

			Promise.all([
				bundle ? Promise.resolve(bundle) : createResBundle(locale, null, false),
				// ResBundle.getString will try to synchronously fetch the plurals resouce so need
				// to proactively fetch it to avoid the sync XHR
				new Promise(resolve => IString.loadPlurals(false, null, null, resolve))
			]).then(([resBundle]) => {
				if (!resBundle) return;

				const translated = props.reduce((obj, prop) => {
					obj[prop].translated = String(getIStringFromBundle(resBundle, obj[prop].text));

					return obj;
				}, Object.assign({}, map));

				this.setState({
					map: translated
				});
			});
		}

		canRender () {
			const entries = Object.values(this.state.map);
			for (const entry in entries) {
				if (entry.translated === false && entry.defaultText === false) {
					return false;
				}
			}

			return true;
		}

		getTextForProp (prop) {
			const {defaultText = '', translated} = this.state.map[prop];

			return translated === false ? defaultText : translated;
		}

		render () {
			if (!this.shouldTranslate()) {
				return (
					<Wrapped {...this.props} />
				);
			}

			if (!this.canRender()) {
				return null;
			}

			if (Wrapped === STRING_ONLY) {
				return this.getTextForProp('children');
			}

			const props = Object.assign({}, this.props);
			Object.keys(this.state.map).forEach(prop => {
				props[prop] = this.getTextForProp(prop);
			});

			return (
				<Wrapped {...props} />
			);
		}
	};

	return I18nContextDecorator(
		{localeProp: 'locale'},
		Decorator
	);
});

const Text = TextDecorator(STRING_ONLY);

export default Text;
export {
	Text,
	TextDecorator
};