const AWSXRay = require('aws-xray-sdk');

function getMiddleware(name) {
  return (call, callback, next) => {
    const traceId = call.metadata.get('traceId').toString();
    const segmentId = call.metadata.get('segmentId').toString();

    const segment = new AWSXRay.Segment(
      name,
      traceId || null,
      segmentId || null,
    );

    const ns = AWSXRay.getNamespace();

    return ns.runAndReturn(async () => {
      AWSXRay.setSegment(segment);
      try {
        await next();
      } catch (err) {
        segment.addError(err);
        throw err;
      } finally {
        segment.close();
      }
    });
  };
}

module.exports = getMiddleware;
