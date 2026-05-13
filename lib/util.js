const writeSuccess = (ret, res, code = 200) => {
  try {
    res.statusCode = code;
    if (typeof ret == "object") {
      res.setHeader("Content-type", "application/json; charset=UTF-8");
      res.end(JSON.stringify(ret));
    } else {
      res.setHeader("Content-type", "text/html; charset=UTF-8");
      res.end(ret);
    }
  } catch (error) {
    writeWithStatus(400, { result: false, description: error.message }, res);
  }
}

const writeError = (ret, res, code = 500) => {
  res.statusCode = code;
  if (typeof ret == "object") {
    console.error(new Date(), JSON.stringify(ret, null, 4));
    res.setHeader("Content-type", "application/json; charset=UTF-8");
    res.end(ret.message ? ret.message : JSON.stringify(ret));
  } else {
    console.error(new Date(), ret);
    res.setHeader("Content-type", "text/html; charset=UTF-8");
    res.end(ret);
  }
}

const writeWithStatus = (statusCode, ret, res) => {
  res.statusCode = statusCode;
  if (typeof ret == "object") {
    res.setHeader("Content-type", "application/json; charset=UTF-8");
    res.end(JSON.stringify(ret));
  } else {
    res.setHeader("Content-type", "text/html; charset=UTF-8");
    res.end(ret);
  }
}

const writeWithContentType = (ret, res, contentType) => {
  try {
    res.statusCode = 200;
    if (typeof ret == "object") {
      res.setHeader("Content-type", contentType);
      res.end(JSON.stringify(ret));
    } else {
      res.setHeader("Content-type", contentType);
      res.end(ret);
    }
  } catch (error) {
    writeWithStatus(400, { result: false, description: error.message }, res);
  }
}

const isUndefined = (name) => {
  var ret = true;
  if (name == undefined || typeof name == "undefined" || name == "undefined" || name == null || name == "") {
    if (name == "") {
      if (IsNumeric(name)) {
        ret = false;
      }
    }
  } else {
    ret = false;
  }

  return ret;
}

const isEmpty = (name) => {
  if (typeof name == "undefined" || name == null || name == "null" || name == "" || name == undefined || name == "undefined") {
    return true;
  } else {
    return false;
  }
}

const isEmptyObj = (obj) => {
  var ret = false;
  try {
    if (obj.constructor === Object && Object.keys(obj).length === 0) {
      ret = true;
    }
  } catch (e) {
    ret = true;
  }
  return ret;
}
