function underPressure(opts) {
    return function underPressureHandler(request, response, next) {
        console.log('Under Pressure working...');
        next();
    }
}

module.exports = underPressure;
module.exports.underPressure = underPressure;
module.exports.default = underPressure;