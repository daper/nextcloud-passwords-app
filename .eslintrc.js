module.exports = {
    'extends': ['standard', 'standard-react'],
    'parser': 'babel-eslint',
    'rules': {
        'react/prop-types': 0,
        'comma-dangle': 0,
        'template-curly-spacing' : 'off',
        'indent' : "off",
        'react/jsx-closing-tag-location': 'off'
    },
    'globals': {
        '__DEV__': false
      }
}