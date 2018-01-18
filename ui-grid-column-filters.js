/*!
 * ui-grid-columns-filters
 * null
 * @license undefined
 * v1.0.2
 * 2016-11-09T08:12:36.734Z
 */
(function () {
  // 'use strict';
  // angular merge fallback
  if (angular.isUndefined(angular.merge)){
    angular.merge = function deepmerge(target, src) {
      var array = Array.isArray(src);
      var dst = array && [] || {};

      if (array) {
        target = target || [];
        dst = dst.concat(target);
        src.forEach(function(e, i) {
          if (typeof dst[i] === 'undefined') {
            dst[i] = e;
          } else if (typeof e === 'object') {
            dst[i] = deepmerge(target[i], e);
          } else {
            if (target.indexOf(e) === -1) {
              dst.push(e);
            }
          }
        });
      } else {
        if (target && typeof target === 'object') {
          Object.keys(target).forEach(function (key) {
            dst[key] = target[key];
          });
        }
        Object.keys(src).forEach(function (key) {
          if (typeof src[key] !== 'object' || !src[key]) {
            dst[key] = src[key];
          }
          else {
            if (!target[key]) {
              dst[key] = src[key];
            } else {
              dst[key] = deepmerge(target[key], src[key]);
            }
          }
        });
      }

      return dst;
    };
  }

  /**
   * @ngdoc module
   * @name ui.grid.columnsFilters
   * @description
   * #ui.grid.columnsFilters
   *
   * <div class="alert alert-warning" role="alert"><strong>Beta</strong> This feature is ready for testing, but it either hasn't seen a lot of use or has some known bugs.</div>
   *
   * This module provides column filter in popup from the filter header cells.
   */
  var module = angular.module('ui.grid.columnsFilters', ['ui.grid']);

  /**
   *  @ngdoc object
   *  @name ui.grid.columnsFilters.constant:uiGridColumnsFiltersConstants
   *
   *  @description constants available in columnsFilters module.
   *
   *  @property {string} featureName               - The name of the feature.
   *  @property {object} filterType                - {
      STRING: 'string',
      NUMBER: 'number',
      DATE: 'date',
      SELECT: 'select'
    }
   * @property {object} dateType                - {
      DATE: 'date',
      TIME: 'time',
      DATETIME: 'datetime-local',
      DATETIMELOCALE: 'datetime-locale'
    }
   *  @property {object} numberOperators                - {
      8: 'Exact',
      512: 'Not Equal',
      128: 'Less than',
      256: 'Less than or equal',
      32: 'More than',
      64: 'More than or equal'
    }
   * @property {object} dateOperators                - {
      8: 'Exact',
      512: 'Not Equal',
      128: 'Before',
      256: 'Before or equal',
      32: 'Later',
      64: 'Later or equal'
    }
   * @property {object} stringOperators                - {
      16: 'Contains',
      4: 'Ends With',
      8: 'Exact',
      512: 'Not Equal',
      2: 'Starts With'
    }
   * @property {object} selectOperators                - {
      16: 'Contains',
      4: 'Ends With',
      8: 'Exact',
      512: 'Not Equal',
      2: 'Starts With'
    }
   * @property {object} logics                - {
      "OR": 'Or',
      "AND": 'And'
    }
   *
   */

  module.constant('uiGridColumnsFiltersConstants', {
    featureName: "columnsFilters",
    filterType: {
      STRING: 'string',
      NUMBER: 'number',
      DATE: 'date',
      SELECT: 'select',
      DROPDOWN_MULTI_SELECT: 'dropdown_multi_select'
    },
    dateTypes: {
      DATE: 'date',
      TIME: 'time',
      DATETIME: 'datetime-locale',
      DATETIMELOCALE: 'datetime-locale'
    },
    numberOperators: {
      8: 'Exact',
      512: 'Not Equal',
      128: 'Less than',
      256: 'Less than or equal',
      32: 'More than',
      64: 'More than or equal'
    },
    dateOperators: {
      8: 'Exact',
      512: 'Not Equal',
      128: 'Before',
      256: 'Before or equal',
      32: 'Later',
      64: 'Later or equal'
    },
    stringOperators: {
      16: 'Contains',
      4: 'Ends With',
      8: 'Exact',
      512: 'Not Equal',
      2: 'Starts With'
    },
    selectOperators: {
      16: 'Contains',
      4: 'Ends With',
      8: 'Exact',
      512: 'Not Equal',
      2: 'Starts With'
    },
    logics: {
      "OR": 'Or',
      "AND": 'And'
    },
    isSelectAllFlag:{},
    filteredData:{}
  });

  /**
   *  @ngdoc service
   *  @name ui.grid.columnsFilters.service:uiGridColumnsFiltersService
   *
   *  @description Services for columnsFilters feature
   */
  /**
   *  @ngdoc object
   *  @name ui.grid.columnsFilters.api:ColumnDef
   *
   *  @description ColumnDef for column filter feature, these are available to be
   *  set using the ui-grid columnDef
   *
   * @property {object} columnFilter - Specific column columnsFilters definitions
   * @property {string} columnFilter.type  - can be: 'date', 'select', 'string', 'number'
   * @property {string} columnFilter.type  - can be: 'date', 'select', 'string', 'number'
   * @property {boolean} columnFilter.multiple   - Boolean stating is a select filter would show as multiple or singular choice
   * @property {object} columnFilter.selectOptions   - states the values of a select option (if needed)
   * @property {object} columnFilter.terms   - holds the search terms for every filter form
   * @property {object} columnFilter.logics  - holds the logics (and/or) for every filter form
   * @property {object} columnFilter.operators   - holds the operators (bigger than, smaller than etc.) for every filter form
   */

  module.service('uiGridColumnsFiltersService', ['$q', 'uiGridColumnsFiltersConstants', 'rowSearcher', 'GridRow', 'gridClassFactory', 'i18nService', 'uiGridConstants', 'rowSorter', '$templateCache',
    function ($q, uiGridColumnsFiltersConstants, rowSearcher, GridRow, gridClassFactory, i18nService, uiGridConstants, rowSorter, $templateCache) {

	  $templateCache.put('ui.grid.columns.filtersfilterButton.html',
	    '<div role="button" tabindex="0" class="ui-grid-column-filter-button" ng-click="toggleFilter($event)" ng-class="{\'ui-grid-column-filter-button-last-col\': isLastCol}" ui-grid-one-bind-id-grid="col.uid + \'-filter-button\'" ui-grid-one-bind-aria-label="i18n.headerCell.aria.columnFilterButtonLabel" aria-haspopup="true"><i class="fa fa-filter fa-lg filterIcon" aria-hidden="true">&nbsp;</i></div>'); /*  ng-class="highlightFilteredHeader(col)" */
	  $templateCache.put('ui.grid.columns.filtersfilters/dateColumnFilter.html',
	  '<select ng-model="col.colDef.columnFilter.operators[0]" class="form-control"><option value="{{key}}" ng-repeat="(key, operator) in operators">{{operator}}</option></select><input class="ui-grid-date-time-picker" type="{{col.colDef.columnFilter.dateType}}" datepicker-popup="dd/MM/yyyy HH:mm:ss" ng-model="col.colDef.columnFilter.terms[0]"> {{col.colDef.columnFilter.terms[0]}}<select ng-model="col.colDef.columnFilter.logics[0]" class="form-control"><option value="{{key}}" ng-repeat="(key, logic) in logics">{{logic}}</option></select><select ng-model="col.colDef.columnFilter.operators[1]" class="form-control"><option value="{{key}}" ng-repeat="(key, operator) in operators">{{operator}}</option></select><input class="dtl" type="{{col.colDef.columnFilter.dateType}}" datepicker-popup="dd/MM/yyyy HH:mm:ss" ng-model="col.colDef.columnFilter.terms[1]">');
	  $templateCache.put('ui.grid.columns.filtersfilters/numberColumnFilter.html',
	  '<select ng-model="col.colDef.columnFilter.operators[0]" class="form-control"><option value="{{key}}" ng-repeat="(key, operator) in operators">{{operator}}</option></select><input class="dtl" type="number" ng-model="col.colDef.columnFilter.terms[0]"> {{col.colDef.columnFilter.terms[0]}}<select ng-model="col.colDef.columnFilter.logics[0]" class="form-control"><option value="{{key}}" ng-repeat="(key, logic) in logics">{{logic}}</option></select><select ng-model="col.colDef.columnFilter.operators[1]" class="form-control"><option value="{{key}}" ng-repeat="(key, operator) in operators">{{operator}}</option></select><input class="dtl" type="number" ng-model="col.colDef.columnFilter.terms[1]">');
	  $templateCache.put('ui.grid.columns.filtersfilters/selectColumnFilter.html',
	  '<select ng-model="col.colDef.columnFilter.operators[0]" class="form-control"><option value="{{key}}" ng-repeat="(key, operator) in operators">{{operator}}</option></select><select placeholder="Select" ng-model="col.colDef.columnFilter.terms" multiple="" class="form-control" ng-options="option.value as option.label for option in selectOptions"></select>');
	  // Default templates
	  $templateCache.put('ui.grid.columns.filtersfilterPopup.html',
	  '<div id="uiGridFilterPopup" ng-style="filterPopupStyle"><form><div id="filterFormControls"><!-- content --></div><div class="md-actions" layout="row" layout-align="center center"><button ng-click="filter(col)" class="btn btn-primary">Filter</button> <button ng-click="clear(col)" class="btn btn-primary">Clear</button></div></form></div>');
	   
	  $templateCache.put('ui.grid.columns.filtersfilters/stringColumnFilter.html',
	  '<select ng-model="col.colDef.columnFilter.operators[0]" class="form-control"><option value="{{key}}" ng-repeat="(key, operator) in operators">{{operator}}</option></select><input class="form-control" placeholder="Your filter text..." ng-model="col.colDef.columnFilter.terms[0]">');
	
	  $templateCache.put('ui.grid.columns.filtersfiltersDropdownMultiSelectPopup.html',
	  '<div id="uiGridFilterPopup" ng-style="filterPopupStyle"><div class="uiGridFilterPopupHeader"><ul ng-click="$event.stopPropagation()"> <li style="cursor:default;"><input class="searchBox" ng-model="filterDropdown.searchText"></li><li><label style="cursor:pointer;"><input type="checkbox" name="selectAll" ng-change="filterDropdown.onSelectAll(col)" ng-model="filterDropdown.selectAll">&nbsp; Select All</label></li></ul></div><div class="uiGridFilterPopupContainer"><form><div id="filterFormControls"><!-- content --></div></form></div><div class="uiGridFilterPopupFooter"><button type="button" ng-click="filterDropdown.updateTable(col)">OK</button>&nbsp;<button type="button" ng-click="filterDropdown.cancelUpdate()">Cancel</button></div></div>');

	  $templateCache.put('ui.grid.columns.filtersfilters/dropdown_multi_selectColumnFilter.html',
	  '<ul ng-click="$event.stopPropagation()"><li ng-repeat="item in filterDropdown.unique_items  | filter:filterDropdown.searchText" style="cursor:default;"><label style="cursor:pointer;"><input type="checkbox" name="search" ng-change="filterDropdown.stateChanged()" ng-model="item.enabled">&nbsp;{{item.label}}</label></li></ul>');

      var runColumnFilter = rowSearcher.runColumnFilter;

     rowSearcher.searchColumn = function searchColumn(grid, row, column, filters) {
	    if (grid.options.useExternalFiltering) {
	      return true;
	    }
	    if(column.colDef.filter && column.colDef.filter.term === "Dynamic"){
		    var termList = column.colDef.columnFilter.dynamicTermList;
		    if(termList.length === grid.rows.length){
		    	return true;
		    }
    	    // Get the column value for this row
    	    var column_value = (column.filterCellFiltered) ? column.grid.getCellDisplayValue(row, column):column.grid.getCellValue(row, column);

    		if(typeof column_value === "string"){
    			column_value = column_value.trim();
    		}
		    if(termList.length === 0){
	    		if(column_value === ""){
	    			return true;
	    		}
		    	return false;
		    }
    		if(column_value === ""){
    			return true;
    		}
    		if(termList.indexOf(column_value) !== -1){
    			return true;
    		}
    		return false;
	    }
	    /*
        if(termList.length > 0){
		    var ret = runDynamicORColumnFilter(grid, row, column, termList);
		    return ret;
        }
        */	         
	    var filtersLength = filters.length;
        for (var i = 0; i < filtersLength; i++) {
          var filter = filters[i];
          if( !angular.isUndefined(filter.term) && filter.term !== null && filter.term !== '' || filter.noTerm ){ 	      
            var ret = runColumnFilter(grid, row, column, filter);
            if (!ret) {
              return false;
            }
          }
        }	    		    
	    return true;	    
     };
     
     function runDynamicORColumnFilter(grid, row, column, searchTermArray) {
         var filterPass = false;
         for (var i = 0; i < searchTermArray.length; i++) {
           var term = searchTermArray[i];
           var newFilter;
	           newFilter = rowSearcher.setupFilters([{
	             term: term,
	             condition: uiGridConstants.filter.CONTAINS,
	             flags: {
	               caseSensitive: false
	             }
	           }])[0];
           // if we are on the second run check for "OR"
           if (i) {
               // if we passed once, then OR should pass all the time
               if (filterPass){
                 return filterPass;
               }
               // if needed, check the next term
               filterPass = runColumnFilter(row.grid, row, column, newFilter);
           }
           filterPass = runColumnFilter(row.grid, row, column, newFilter);
         }	     
         return filterPass;
       }

      var service = {
        initializeGrid: function (grid, $scope) {
          //add feature namespace and any properties to grid for needed
          /**
           *  @ngdoc object
           *  @name ui.grid.columnsFilters.api:Grid
           *
           *  @description Grid properties and functions added for columnsFilters
           *
           *  @property {object} columnsFilters - object that holds global definitions
           */
          grid.columnsFilters = {
            currentColumn: undefined
          };

          angular.forEach(grid.options.columnDefs, function (colDef) {
            if (colDef.enableFiltering !== false) {
              var columnFilter = {
                terms: [],
                dynamicTermList: [],
                operators: [],
                logics: []
              };

              if (angular.isUndefined(colDef.columnFilter)) {
                colDef.columnFilter = columnFilter;
              }
              else {
                colDef.columnFilter = angular.merge({}, columnFilter, colDef.columnFilter);
              }
              colDef.filterHeaderTemplate = $templateCache.get('ui.grid.columns.filtersfilterButton.html');
            }
            else {
              colDef.filterHeaderTemplate = '<span ng-if="::false"></span>';
            }
          });
        },
        /**
         * @ngdoc method
         * @name ui.grid.columnsFilters.service:uiGridColumnsFiltersService#filterPopupStyle
         * @description Calculates the column filter's popup absolute position
         * @param {event} $event the event from the click event
         * @returns {object} an object with top and left styling expressions
         */
        filterPopupStyle: function ($event, col) {
          var rect = $event.target.parentElement.getClientRects()[0];
          return {
            top: (window.pageYOffset || document.body.scrollTop) + (rect.height + rect.top) + 'px',
            left: rect.left  - col.drawnWidth + 'px'
            // width: col.drawnWidth + 'px'
          };
        },
        /**
         * @ngdoc method
         * @name ui.grid.columnsFilters.service:uiGridColumnsFiltersService#filter
         * @description Sets the filter parameters of the column
         * @param {column} col - the column that is now being filtered
         */
        filter: function (col) {
          var terms = col.colDef.columnFilter.terms;

          var logics = col.colDef.columnFilter.logics;
          col.colDef.columnFilter.dynamicTermList.splice(0, col.colDef.columnFilter.dynamicTermList.length);
          // add the data into the filter object of the column
          // the terms array is the "term"
          col.filters[0].term = terms;
          
          if(!col.filters[0].condition){
          // set condition as our filter function
          col.filters[0].condition = uiGridConstants.filter.CONTAINS;
          } 
          // logic is new, so we will add it, and handle it in our override function
          col.filters[0].logic = logics;
          col.grid.api.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
        },
        /**
         * @ngdoc method
         * @name ui.grid.columnsFilters.service:uiGridColumnsFiltersService#filter
         * @description Sets the filter parameters of the column
         * @param {column} col - the column that is now being filtered
         */
        filterByTermArray: function (col, termArray) {
          // Append filter terms
          col.colDef.columnFilter.dynamicTermList = termArray;
  	  	  col.filters[0].term = "Dynamic"; // dummy filter so the handler is invoked

          // set condition as our filter function
          col.filters[0].condition = uiGridConstants.filter.CONTAINS;
        
          col.grid.api.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
        },        
        /**
         * @ngdoc method
         * @name ui.grid.columnsFilters.service:uiGridColumnsFiltersService#clear
         * @description Clears the filter parameters of the column
         * @param {column} col -  the column that is now being filtered
         */
        clear: function (col) {
          if (angular.isUndefined(col.filters[0].term)) {
            return;
          }

          if (!angular.isArray(col.filters[0].term)){
            col.filters[0].term = [];
          }
          else {
            col.filters[0].term.length = 0;
          }

          col.filters[0].condition = undefined;
          col.grid.api.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
        }
      };

      return service;
    }]);

  module.directive('uiGridColumnsFilters', ['$compile', 'gridUtil', 'uiGridColumnsFiltersService', 'uiGridColumnsFiltersConstants', '$templateCache', '$document',
    function ($compile, gridUtil, uiGridColumnsFiltersService, uiGridColumnsFiltersConstants, $templateCache, $document) {
      return {
        require: 'uiGrid',
        scope: false,
        link: function ($scope, $elm, $attrs, uiGridCtrl) {
          uiGridColumnsFiltersService.initializeGrid(uiGridCtrl.grid, $scope);
        }
      };

      /**
       *  @ngdoc directive
       *  @name ui.grid.columnsFilters.directive:uiGridColumnFilters
       *
       *  @description directive for columnsFilters button in column header
       */

    }]);


  /**
   *  @ngdoc directive
   *  @name ui.grid.columnsFilters.directive.api:uiGridFilter
   *
   *  @description Extanding the uiGridFilter directive to prepare the column filter
   */
  module.directive('uiGridFilter', ['uiGridColumnsFiltersService', 'uiGridColumnsFiltersConstants', '$templateCache', '$compile', 'uiGridConstants',
    function (uiGridColumnsFiltersService, uiGridColumnsFiltersConstants, $templateCache, $compile, uiGridConstants) {
      return {
        priority: 500,
        scope: false,
        link: function ($scope) {
          /**
           * @description watch for the data change (rows length) and then recreate the select options
           */
          function dataChangeCallback(){
            // now wait for the rows to be updated with the new data
            var watchForRows = $scope.$watch('col.grid.rows.length', function (newRowsLength) {
              // make sure we have updated...
              if (newRowsLength !== $scope.col.grid.options.data.length) {
                return;
              }
              // set the options
              $scope.selectOptions = $scope.setSelectOptions($scope.selectOptions, currentColumn);
              // remove the listener
              watchForRows();
              
            });
          }

          //TODO::need to decide if we work with the filter API when it is sufficient and only expand it...
          var currentColumn = $scope.col; // cache current column

          // if we're not supposed to filter this column, no need to activate filter for it...
          if (angular.isDefined(currentColumn.colDef.enableFiltering) && !currentColumn.colDef.enableFiltering) {
            return;
          }

          // get the filter type (default is string)
          var filterType = uiGridColumnsFiltersConstants.filterType.STRING;
          if (angular.isDefined(currentColumn.colDef.columnFilter) && angular.isDefined(currentColumn.colDef.columnFilter.type)) {
            filterType = currentColumn.colDef.columnFilter.type;
          }
          else if (angular.isDefined(currentColumn.colDef.filter) && angular.isDefined(currentColumn.colDef.filter.type)) {
            filterType = currentColumn.colDef.filter.type;
          }

          // get the filter popup template
          var thisFilterTemplate = 'ui.grid.columns.filtersfilters/%%^^ColumnFilter.html'.replace('%%^^', filterType); // get the filter type template name
          var formElementsTemplate = $templateCache.get(thisFilterTemplate);
          var popupTemplate;
          if (filterType === uiGridColumnsFiltersConstants.filterType.DROPDOWN_MULTI_SELECT) {
        	  popupTemplate =  $templateCache.get('ui.grid.columns.filtersfiltersDropdownMultiSelectPopup.html').replace('<!-- content -->', formElementsTemplate); // get the full popup template    
          }else{
        	  popupTemplate = $templateCache.get('ui.grid.columns.filtersfilterPopup.html').replace('<!-- content -->', formElementsTemplate); // get the full popup template        	  
          }
         
          function getUniqueColumnValues(col){
          	 var unique_items = [];
               var filteredItems = [];
               var tmpIDs = [];
               var tmpItem = {};
               var rows = col.grid.rows;
               for (var i = 0; i < rows.length; i++) {
                   // get the label and the value
                   tmpItem.label = col.grid.getCellDisplayValue(rows[i], col);
                   tmpItem.value = (col.filterCellFiltered) ? col.grid.getCellDisplayValue(rows[i], col):col.grid.getCellValue(rows[i], col);
                   tmpItem.enabled = true;
                   tmpItem.enabledUndo = true;
	           	   if(tmpItem.value && (typeof tmpItem.value === "string")){
	           		  tmpItem.value = tmpItem.value.trim();
	        	   }
                   // make sure we take only unique values
                   if (tmpItem.value && (tmpIDs.indexOf(tmpItem.value) === -1)) {
                     tmpIDs.push(tmpItem.value);
                     unique_items.push(angular.copy(tmpItem));
                   }
                 }
               return unique_items;
           }	
          
          // get the selection options if needed
          if (filterType === uiGridColumnsFiltersConstants.filterType.SELECT) {
            currentColumn.colDef.columnFilter.logics = ["OR"];
            if (angular.isDefined(currentColumn.colDef.columnFilter) && angular.isDefined(currentColumn.colDef.columnFilter.selectOptions)) {
              $scope.selectOptions = currentColumn.colDef.columnFilter.selectOptions;
            }
            else if (angular.isDefined(currentColumn.colDef.filter) && angular.isDefined(currentColumn.colDef.filter.selectOptions)) {
              $scope.selectOptions = currentColumn.colDef.filter.selectOptions;
            }

            // remove multiple selection if needed - can be defined only in th e columnFilter right now
            if (angular.isDefined(currentColumn.colDef.columnFilter) && !currentColumn.colDef.columnFilter.multiple) {
              popupTemplate = popupTemplate.replace('multiple', '');
              popupTemplate = popupTemplate.replace('.terms', '.terms[0]');
            }

            if (angular.isUndefined($scope.selectOptions)) {
              // if we have select options, it means we have definitions set and we use the static def
              $scope.setSelectOptions = function (items, col) {
                // if we have static definitions, do nothing
                if (angular.isDefined(col.colDef.filter) && angular.isDefined(col.colDef.filter.selectOptions) ||
                  angular.isDefined(col.colDef.columnFilter) && angular.isDefined(col.colDef.columnFilter.selectOptions)) {
                  return items;
                }

                // if we don't create a dynamic selectOptions array
                var filteredItems = [];
                var tmpIDs = [];
                var tmpItem = {};
                var rows = col.grid.rows;

                // insert the items into the selectOptions array
                items = getUniqueColumnValues(col);// filteredItems;
                return items;
              };

              $scope.selectOptions = $scope.setSelectOptions($scope.selectOptions, currentColumn);

              currentColumn.grid.registerDataChangeCallback(dataChangeCallback, [uiGridConstants.dataChange.ALL]);

            }
          }
          
          if (filterType === uiGridColumnsFiltersConstants.filterType.DROPDOWN_MULTI_SELECT) {

              function updateFilterDropdown(){	  
     	       	 $scope.filterDropdown = {
     	   			  selectAll : true,
     	   			  onSelectAll : function(col){
     	   				  $scope.filterDropdown.unique_items.forEach(function(colItm){
     	   					  colItm.enabled = $scope.filterDropdown.selectAll;
     	   				  });
     	   			  },
     	   			  searchText : "",
     	   	          unique_items : getUniqueColumnValues(currentColumn),
 	         		  stateChanged : function(){
 	         			  	  $scope.filterDropdown.selectAll = !($scope.filterDropdown.unique_items.some(function(item){
				        		return item.enabled === false;
 	         			  	  }));
 		          	  },
 		          	  updateGridColumns:function(col){
 			        	  var terms = $scope.filterDropdown.unique_items.filter(function(colItmVal){
 			        		  return colItmVal.enabled;
 			        	  }).map(function(colItmVal){
 			        		  return colItmVal.value;
 			        	  });
 			        	  uiGridColumnsFiltersService.filterByTermArray(col, terms);
 			        	 uiGridColumnsFiltersConstants.filteredData[col.displayName] = terms.toString();
 			        	uiGridColumnsFiltersConstants.isSelectAllFlag[col.displayName] = $scope.filterDropdown.selectAll;
 		          	  },
 		          	  updateTable:function(col){	    
 		          	   	 $scope.filterDropdown.unique_items.forEach(function(item1){
					        	item1.enabledUndo = item1.enabled;
 	         			 }); 		          	        	  
 		          		 $scope.filterDropdown.updateGridColumns(col);
 		          	  },
 		          	  cancelUpdate:function(){
 		          	   	 $scope.filterDropdown.unique_items.forEach(function(item1){
					        	item1.enabled = item1.enabledUndo;
 	         			 });
 		          	     $scope.filterDropdown.stateChanged();
 		          	  }
     	       	  }
                }
              
            currentColumn.grid.registerDataChangeCallback(updateFilterDropdown, [uiGridConstants.dataChange.ROW]);        	  
          }
         
          $scope.filter = uiGridColumnsFiltersService.filter; // set the filtering function in the scope
          $scope.clear = uiGridColumnsFiltersService.clear; // set the clear filter function in the scope
          $scope.operators = uiGridColumnsFiltersConstants[filterType + 'Operators']; // set the operators in the scope
          $scope.logics = uiGridColumnsFiltersConstants.logics; // set the logics in the scope
          
          $scope.highlightFilteredHeader = function(col) {
        	 var isFilterContainingTerm = function(filter){
        		 if(angular.isArray(filter.term)){
        			 return filter.term.some(function(term){            				 
        				 return term.trim().length > 0;
        			 });
        		 }else if(filter.term.trim() !== ''){
        			 return true;
        		 }
        	 } 
        	 var colFilter;
        	 if (angular.isObject(col.filters)){		
        		 for(index in col.filters){
        			 if (col.filters.hasOwnProperty(index)) {
        				 var filter = col.filters[index];
    	        		 if(!angular.isUndefined(filter) && !angular.isUndefined(filter.term) && (filter.term !== null)){
    	        			 if(isFilterContainingTerm(filter)){
    	        				 colFilter = filter;
    	        				 break;
    	        			 } 
    	        		 }        				
        			 }
        		 }
        	 }else if (angular.isArray(col.filters)){     // Does not work in IE   	 
	        	 colFilter = col.filters.find(function(filter){
	        		 if(!angular.isUndefined(filter.term) && (filter.term !== null)){
	        			 return isFilterContainingTerm(filter);
	        		 } 
	      	      });
        	 }

        	var checklistModified = !angular.isUndefined($scope.filterDropdown) && !angular.isUndefined($scope.filterDropdown.unique_items) 
        							&& ($scope.filterDropdown.unique_items.some(function(item){
							        		return item.enabled === false;
							        	}));
        	
        	if(checklistModified){
        		return 'highlight-ui-grid-column-filter-button';
        	}
        		
        	if(colFilter && colFilter.term !== "Dynamic"){
	            return 'highlight-ui-grid-column-filter-button';
        	}
        	
      	    return '';
      	  };
      	  
          // toggle filter popup
          $scope.toggleFilter = function(event) {
            event.stopPropagation();
            event.preventDefault();

            if (currentColumn.grid.columnsFilters.currentColumn) {
              // if we have an open filter
              angular.element(document.getElementById('uiGridFilterPopup')).remove(); //remove it
              if (angular.equals(currentColumn.grid.columnsFilters.currentColumn, currentColumn)) {
                // if the same column that its filter shown is clicked, close it
                currentColumn.grid.columnsFilters.currentColumn = undefined; //clear the current open column popup
                return;
              }
            }

            // open a popup
            currentColumn.grid.columnsFilters.currentColumn = currentColumn; // set the current opened columnFilter
            $scope.filterPopupStyle = uiGridColumnsFiltersService.filterPopupStyle(event, currentColumn); //set the style in the scope
            var popupElement = $compile(popupTemplate)($scope); // compile it
            angular.element(document.body).append(popupElement); // append to body

            angular.element(document.body).on('click', $scope.toggleFilter); // make sure the popup closes when clicking outside

            // make sure popup is not closing when clicking inside
            popupElement.on('click', function () {
              event.preventDefault();
              event.stopPropagation();
            });

            // remove the click events on destroy
            popupElement.on('$destroy', function () {
              popupElement.off('click');
              angular.element(document.body).off('click', $scope.toggleFilter);
            });
          };
        }
      };
    }]);

})();
