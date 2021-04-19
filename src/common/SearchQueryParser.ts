import {
  ANDSearchQuery,
  DistanceSearch,
  FromDateSearch,
  MaxRatingSearch,
  MaxResolutionSearch,
  MinRatingSearch,
  MinResolutionSearch,
  OrientationSearch,
  ORSearchQuery,
  RangeSearch,
  SearchListQuery,
  SearchQueryDTO,
  SearchQueryTypes,
  SomeOfSearchQuery,
  TextSearch,
  TextSearchQueryMatchTypes,
  TextSearchQueryTypes,
  ToDateSearch
} from './entities/SearchQueryDTO';
import {Utils} from './Utils';


export interface QueryKeywords {
  portrait: string;
  landscape: string;
  orientation: string;
  kmFrom: string;
  maxResolution: string;
  minResolution: string;
  maxRating: string;
  minRating: string;
  NSomeOf: string;
  someOf: string;
  or: string;
  and: string;
  from: string;
  to: string;
  caption: string;
  directory: string;
  file_name: string;
  keyword: string;
  person: string;
  position: string;
}

export class SearchQueryParser {
  constructor(private keywords: QueryKeywords) {
  }

  public static stringifyText(text: string, matchType = TextSearchQueryMatchTypes.like): string {
    if (matchType === TextSearchQueryMatchTypes.exact_match) {
      return '"' + text + '"';
    }
    if (text.indexOf(' ') !== -1) {
      return '(' + text + ')';
    }
    return text;
  }

  private static stringifyDate(time: number): string {
    const date = new Date(time);
    // simplify date with yeah only if its first of jan
    if (date.getMonth() === 0 && date.getDate() === 1) {
      return date.getFullYear().toString();
    }
    return this.stringifyText(date.toLocaleDateString());
  }

  private static parseDate(text: string): number {
    if (text.charAt(0) === '"' || text.charAt(0) === '(') {
      text = text.substring(1);
    }
    if (text.charAt(text.length - 1) === '"' || text.charAt(text.length - 1) === ')') {
      text = text.substring(0, text.length - 1);
    }
    // it is the year only
    if (text.length === 4) {
      const d = new Date(2000, 0, 1);
      d.setFullYear(parseInt(text, 10));
      return d.getTime();
    }
    return Date.parse(text);
  }

  public parse(str: string, implicitOR = true): SearchQueryDTO {
    str = str.replace(/\s\s+/g, ' ') // remove double spaces
      .replace(/:\s+/g, ':').replace(/\)(?=\S)/g, ') ').trim();

    if (str.charAt(0) === '(' && str.charAt(str.length - 1) === ')') {
      str = str.slice(1, str.length - 1);
    }
    const fistSpace = (start = 0) => {
      const bracketIn = [];
      let quotationMark = false;
      for (let i = start; i < str.length; ++i) {
        if (str.charAt(i) === '"') {
          quotationMark = !quotationMark;
          continue;
        }
        if (str.charAt(i) === '(') {
          bracketIn.push(i);
          continue;
        }
        if (str.charAt(i) === ')') {
          bracketIn.pop();
          continue;
        }

        if (quotationMark === false &&
          bracketIn.length === 0 &&
          str.charAt(i) === ' ') {
          return i;
        }
      }
      return str.length - 1;
    };

    // tokenize
    const tokenEnd = fistSpace();

    if (tokenEnd !== str.length - 1) {
      if (str.startsWith(' ' + this.keywords.and, tokenEnd)) {
        return {
          type: SearchQueryTypes.AND,
          list: [this.parse(str.slice(0, tokenEnd), implicitOR), // trim brackets
            this.parse(str.slice(tokenEnd + (' ' + this.keywords.and).length), implicitOR)]
        } as ANDSearchQuery;
      } else if (str.startsWith(' ' + this.keywords.or, tokenEnd)) {
        return {
          type: SearchQueryTypes.OR,
          list: [this.parse(str.slice(0, tokenEnd), implicitOR), // trim brackets
            this.parse(str.slice(tokenEnd + (' ' + this.keywords.or).length), implicitOR)]
        } as ORSearchQuery;
      } else { // Relation cannot be detected
        return {
          type: implicitOR === true ? SearchQueryTypes.OR : SearchQueryTypes.UNKNOWN_RELATION,
          list: [this.parse(str.slice(0, tokenEnd), implicitOR), // trim brackets
            this.parse(str.slice(tokenEnd), implicitOR)]
        } as SearchListQuery;
      }
    }
    if (str.startsWith(this.keywords.someOf + ':') ||
      new RegExp('^\\d*-' + this.keywords.NSomeOf + ':').test(str)) {
      const prefix = str.startsWith(this.keywords.someOf + ':') ?
        this.keywords.someOf + ':' :
        new RegExp('^\\d*-' + this.keywords.NSomeOf + ':').exec(str)[0];
      let tmpList: any = this.parse(str.slice(prefix.length + 1, -1), false); // trim brackets

      const unfoldList = (q: SearchListQuery): SearchQueryDTO[] => {
        if (q.list) {
          if (q.type === SearchQueryTypes.UNKNOWN_RELATION) {
            return [].concat.apply([], q.list.map(e => unfoldList(e as any))); // flatten array
          } else {
            q.list.forEach(e => unfoldList(e as any));
          }
        }
        return [q];
      };
      tmpList = unfoldList(tmpList as SearchListQuery);
      const ret = {
        type: SearchQueryTypes.SOME_OF,
        list: tmpList
      } as SomeOfSearchQuery;
      if (new RegExp('^\\d*-' + this.keywords.NSomeOf + ':').test(str)) {
        ret.min = parseInt(new RegExp(/^\d*/).exec(str)[0], 10);
      }
      return ret;
    }

    if (str.startsWith(this.keywords.from + ':')) {
      return {
        type: SearchQueryTypes.from_date,
        value: SearchQueryParser.parseDate(str.substring((this.keywords.from + ':').length))
      } as FromDateSearch;
    }
    if (str.startsWith(this.keywords.to + ':')) {
      return {
        type: SearchQueryTypes.to_date,
        value: SearchQueryParser.parseDate(str.substring((this.keywords.to + ':').length))
      } as ToDateSearch;
    }

    if (str.startsWith(this.keywords.minRating + ':')) {
      return {
        type: SearchQueryTypes.min_rating,
        value: parseInt(str.slice((this.keywords.minRating + ':').length), 10)
      } as MinRatingSearch;
    }
    if (str.startsWith(this.keywords.maxRating + ':')) {
      return {
        type: SearchQueryTypes.max_rating,
        value: parseInt(str.slice((this.keywords.maxRating + ':').length), 10)
      } as MaxRatingSearch;
    }
    if (str.startsWith(this.keywords.minResolution + ':')) {
      return {
        type: SearchQueryTypes.min_resolution,
        value: parseInt(str.slice((this.keywords.minResolution + ':').length), 10)
      } as MinResolutionSearch;
    }
    if (str.startsWith(this.keywords.maxResolution + ':')) {
      return {
        type: SearchQueryTypes.max_resolution,
        value: parseInt(str.slice((this.keywords.maxResolution + ':').length), 10)
      } as MaxResolutionSearch;
    }
    if (new RegExp('^\\d*-' + this.keywords.kmFrom + ':').test(str)) {
      let from = str.slice(new RegExp('^\\d*-' + this.keywords.kmFrom + ':').exec(str)[0].length);
      if ((from.charAt(0) === '(' && from.charAt(from.length - 1) === ')') ||
        (from.charAt(0) === '"' && from.charAt(from.length - 1) === '"')) {
        from = from.slice(1, from.length - 1);
      }
      return {
        type: SearchQueryTypes.distance,
        distance: parseInt(new RegExp(/^\d*/).exec(str)[0], 10),
        from: {text: from}
      } as DistanceSearch;
    }

    if (str.startsWith(this.keywords.orientation + ':')) {
      return {
        type: SearchQueryTypes.orientation,
        landscape: str.slice((this.keywords.orientation + ':').length) === this.keywords.landscape
      } as OrientationSearch;
    }

    // parse text search
    const tmp = TextSearchQueryTypes.map(type => ({
      key: (this.keywords as any)[SearchQueryTypes[type]] + ':',
      queryTemplate: {type, text: ''} as TextSearch
    }));
    for (const typeTmp of tmp) {
      if (str.startsWith(typeTmp.key)) {
        const ret: TextSearch = Utils.clone(typeTmp.queryTemplate);
        if (str.charAt(typeTmp.key.length) === '"' && str.charAt(str.length - 1) === '"') {
          ret.text = str.slice(typeTmp.key.length + 1, str.length - 1);
          ret.matchType = TextSearchQueryMatchTypes.exact_match;
        } else if (str.charAt(typeTmp.key.length) === '(' && str.charAt(str.length - 1) === ')') {
          ret.text = str.slice(typeTmp.key.length + 1, str.length - 1);
        } else {
          ret.text = str.slice(typeTmp.key.length);
        }
        return ret;
      }
    }


    return {type: SearchQueryTypes.any_text, text: str} as TextSearch;
  }

  public stringify(query: SearchQueryDTO): string {
    if (!query || !query.type) {
      return '';
    }
    switch (query.type) {
      case SearchQueryTypes.AND:
        return '(' + (query as SearchListQuery).list.map(q => this.stringify(q)).join(' ' + this.keywords.and + ' ') + ')';

      case SearchQueryTypes.OR:
        return '(' + (query as SearchListQuery).list.map(q => this.stringify(q)).join(' ' + this.keywords.or + ' ') + ')';

      case SearchQueryTypes.SOME_OF:
        if ((query as SomeOfSearchQuery).min) {
          return (query as SomeOfSearchQuery).min + '-' + this.keywords.NSomeOf + ':(' +
            (query as SearchListQuery).list.map(q => this.stringify(q)).join(' ') + ')';
        }
        return this.keywords.someOf + ':(' +
          (query as SearchListQuery).list.map(q => this.stringify(q)).join(' ') + ')';


      case SearchQueryTypes.orientation:
        return this.keywords.orientation + ':' +
          ((query as OrientationSearch).landscape ? this.keywords.landscape : this.keywords.portrait);

      case SearchQueryTypes.from_date:
        if (!(query as FromDateSearch).value) {
          return '';
        }
        return this.keywords.from + ':' +
          SearchQueryParser.stringifyDate((query as FromDateSearch).value);
      case SearchQueryTypes.to_date:
        if (!(query as ToDateSearch).value) {
          return '';
        }
        return this.keywords.to + ':' +
          SearchQueryParser.stringifyDate((query as ToDateSearch).value);
      case SearchQueryTypes.min_rating:
        return this.keywords.minRating + ':' + (isNaN((query as RangeSearch).value) ? '' : (query as RangeSearch).value);
      case SearchQueryTypes.max_rating:
        return this.keywords.maxRating + ':' + (isNaN((query as RangeSearch).value) ? '' : (query as RangeSearch).value);
      case SearchQueryTypes.min_resolution:
        return this.keywords.minResolution + ':' + (isNaN((query as RangeSearch).value) ? '' : (query as RangeSearch).value);
      case SearchQueryTypes.max_resolution:
        return this.keywords.maxResolution + ':' + (isNaN((query as RangeSearch).value) ? '' : (query as RangeSearch).value);
      case SearchQueryTypes.distance:
        if ((query as DistanceSearch).from.text.indexOf(' ') !== -1) {
          return (query as DistanceSearch).distance + '-' + this.keywords.kmFrom + ':(' + (query as DistanceSearch).from.text + ')';
        }
        return (query as DistanceSearch).distance + '-' + this.keywords.kmFrom + ':' + (query as DistanceSearch).from.text;

      case SearchQueryTypes.any_text:
        return SearchQueryParser.stringifyText((query as TextSearch).text, (query as TextSearch).matchType);

      case SearchQueryTypes.person:
      case SearchQueryTypes.position:
      case SearchQueryTypes.keyword:
      case SearchQueryTypes.caption:
      case SearchQueryTypes.file_name:
      case SearchQueryTypes.directory:
        if (!(query as TextSearch).text) {
          return '';
        }
        return (this.keywords as any)[SearchQueryTypes[query.type]] + ':' +
          SearchQueryParser.stringifyText((query as TextSearch).text, (query as TextSearch).matchType);

      default:
        throw new Error('Unknown type: ' + query.type);
    }
  }
}