class AggregationBuilder {
  constructor(model) {
    this.model = model;
    this.pipeline = [];
    this.transformFn = null;
  }

  match(criteria) {
    this.pipeline.push({ $match: criteria });
    return this;
  }

  sort(sortObj) {
    this.pipeline.push({ $sort: sortObj });
    return this;
  }

  skip(n) {
    this.pipeline.push({ $skip: n });
    return this;
  }

  limit(n) {
    this.pipeline.push({ $limit: n });
    return this;
  }

  lookup({
    from,
    localField,
    foreignField,
    as,
    pipeline = null,
    let: letVars = null,
  }) {
    const lookupObj = { from, as };

    if (pipeline) {
      lookupObj.pipeline = pipeline;

      if (letVars) {
        lookupObj.let = letVars;
      } else if (localField) {
        lookupObj.let = { local: `$${localField}` };
      }
    } else {
      lookupObj.localField = localField;
      lookupObj.foreignField = foreignField;
    }

    this.pipeline.push({ $lookup: lookupObj });
    return this;
  }

  addFields(fields) {
    this.pipeline.push({ $addFields: fields });
    return this;
  }

  project(fields) {
    this.pipeline.push({ $project: fields });
    return this;
  }

  unwind(options) {
    this.pipeline.push({ $unwind: options });
    return this;
  }

  replaceRoot(options) {
    this.pipeline.push({ $replaceRoot: options });
    return this;
  }

  sample(options) {
    this.pipeline.push({ $sample: options });
    return this;
  }

  transform(fn) {
    this.transformFn = fn;
    return this;
  }

  async exec() {
    return await this.model.aggregate(this.pipeline);
  }

  async execTransformed() {
    const data = await this.exec();
    if (this.transformFn) return data.map(this.transformFn);
    return data;
  }
}

module.exports = AggregationBuilder;
