
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

  lookup({ from, localField, foreignField, as, pipeline = null }) {
    const lookupStage = {
      $lookup: { from, localField, foreignField, as },
    };
    if (pipeline) {
      lookupStage.$lookup.let = { local: `$${localField}` };
      lookupStage.$lookup.pipeline = pipeline;
      delete lookupStage.$lookup.localField;
      delete lookupStage.$lookup.foreignField;
    }
    this.pipeline.push(lookupStage);
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
