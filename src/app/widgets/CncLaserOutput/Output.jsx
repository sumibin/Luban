import React, { PureComponent } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { actions as workspaceActions } from '../../flux/workspace';
import { actions as editorActions } from '../../flux/editor';
import { actions as projectActions } from '../../flux/project';
import { DISPLAYED_TYPE_TOOLPATH, PAGE_EDITOR, PAGE_PROCESS } from '../../constants';

import modal from '../../lib/modal';
import i18n from '../../lib/i18n';
import Thumbnail from '../CncLaserShared/Thumbnail';


class Output extends PureComponent {
    static propTypes = {
        ...withRouter.propTypes,
        setTitle: PropTypes.func.isRequired,
        minimized: PropTypes.bool.isRequired,

        headType: PropTypes.string.isRequired,
        page: PropTypes.string.isRequired,

        modelGroup: PropTypes.object.isRequired,
        toolPathGroup: PropTypes.object.isRequired,
        canGenerateGcode: PropTypes.bool.isRequired,
        hasModel: PropTypes.bool,
        displayedType: PropTypes.string.isRequired,
        previewFailed: PropTypes.bool.isRequired,
        isGcodeGenerating: PropTypes.bool.isRequired,
        workflowState: PropTypes.string.isRequired,
        gcodeFile: PropTypes.object,
        commitGenerateGcode: PropTypes.func.isRequired,
        commitGenerateViewPath: PropTypes.func.isRequired,
        renderGcodeFile: PropTypes.func.isRequired,
        createToolPath: PropTypes.func.isRequired,
        exportFile: PropTypes.func.isRequired,
        switchToPage: PropTypes.func.isRequired,
        showToolPathGroupObject: PropTypes.func.isRequired,
        showModelGroupObject: PropTypes.func.isRequired
    };

    thumbnail = React.createRef();

    actions = {
        onGenerateGcode: () => {
            const thumbnail = this.thumbnail.current.getThumbnail();
            this.props.commitGenerateGcode(thumbnail);
        },
        onLoadGcode: () => {
            const { gcodeFile } = this.props;
            if (gcodeFile === null) {
                return;
            }
            this.props.renderGcodeFile(gcodeFile);

            this.props.history.push('/workspace');
            window.scrollTo(0, 0);
        },
        onExport: () => {
            const { gcodeFile } = this.props;
            if (gcodeFile === null) {
                return;
            }
            this.props.exportFile(gcodeFile.uploadName);
        },
        onProcess: () => {
            if (this.props.page === PAGE_EDITOR) {
                this.props.switchToPage(PAGE_PROCESS);
            } else {
                this.props.createToolPath();
            }
        },
        onSimulation: () => {
            this.props.commitGenerateViewPath();
        },
        showAndHideToolPathObject: () => {
            if (this.props.displayedType === DISPLAYED_TYPE_TOOLPATH) {
                this.props.showModelGroupObject();
            } else {
                this.props.showToolPathGroupObject();
            }
        }
    };

    constructor(props) {
        super(props);
        this.props.setTitle(i18n._('Actions'));
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.previewFailed && !this.props.previewFailed) {
            modal({
                title: i18n._('Failed to preview'),
                body: i18n._('Failed to preview, please modify parameters and try again.')
            });
        }
    }

    render() {
        const actions = this.actions;
        const { page, workflowState, isGcodeGenerating, canGenerateGcode, gcodeFile, hasModel, headType, displayedType } = this.props;
        const isEditor = page === PAGE_EDITOR;
        const isProcess = page === PAGE_PROCESS;
        const isCNC = headType === 'cnc';

        return (
            <div>
                <div>
                    {isEditor && (
                        <button
                            type="button"
                            className="sm-btn-large sm-btn-default"
                            onClick={this.actions.onProcess}
                            style={{ display: 'block', width: '100%' }}
                        >
                            {i18n._('Process')}
                        </button>
                    )}
                    {isProcess && (
                        <button
                            type="button"
                            className="sm-btn-large sm-btn-default"
                            onClick={this.actions.showAndHideToolPathObject}
                            style={{ display: 'block', width: '100%', marginBottom: '10px' }}
                        >
                            {displayedType === DISPLAYED_TYPE_TOOLPATH ? i18n._('Hide Toolpath') : i18n._('Show Toolpath')}
                        </button>
                    )}
                    {isProcess && (
                        <div>
                            {isCNC && (
                                <button
                                    type="button"
                                    className="sm-btn-large sm-btn-default"
                                    disabled={!canGenerateGcode || isGcodeGenerating}
                                    onClick={this.actions.onSimulation}
                                    style={{ display: 'block', width: '100%' }}
                                >
                                    {i18n._('Simulate')}
                                </button>
                            )}
                            <button
                                type="button"
                                className="sm-btn-large sm-btn-default"
                                onClick={actions.onGenerateGcode}
                                disabled={!canGenerateGcode || isGcodeGenerating}
                                style={{ display: 'block', width: '100%', marginTop: '10px' }}
                            >
                                {i18n._('Generate G-code')}
                            </button>
                            <button
                                type="button"
                                className="sm-btn-large sm-btn-default"
                                onClick={actions.onLoadGcode}
                                disabled={!hasModel || workflowState === 'running' || isGcodeGenerating || gcodeFile === null}
                                style={{ display: 'block', width: '100%', marginTop: '10px' }}
                            >
                                {i18n._('Load G-code to Workspace')}
                            </button>
                            <button
                                type="button"
                                className="sm-btn-large sm-btn-default"
                                onClick={actions.onExport}
                                disabled={!hasModel || workflowState === 'running' || isGcodeGenerating || gcodeFile === null}
                                style={{ display: 'block', width: '100%', marginTop: '10px' }}
                            >
                                {i18n._('Export G-code to File')}
                            </button>
                        </div>
                    )}
                </div>
                <Thumbnail
                    ref={this.thumbnail}
                    modelGroup={this.props.modelGroup}
                    toolPathGroup={this.props.toolPathGroup}
                    minimized={this.props.minimized}
                />
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const { workflowState } = state.machine;
    const { widgets } = state.widget;
    const { widgetId, headType } = ownProps;
    const { page, isGcodeGenerating,
        previewFailed, modelGroup, toolPathGroup, displayedType, gcodeFile } = state[headType];

    const canGenerateGcode = toolPathGroup.canGenerateGcode();

    return {
        page,
        headType,
        modelGroup,
        hasModel: modelGroup.hasModel(),
        displayedType,
        toolPathGroup,
        canGenerateGcode,
        isGcodeGenerating,
        workflowState,
        previewFailed,
        gcodeFile,
        autoPreview: widgets[widgetId].autoPreview
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    const { headType } = ownProps;
    return {
        switchToPage: (page) => dispatch(editorActions.switchToPage(headType, page)),
        showToolPathGroupObject: () => dispatch(editorActions.showToolPathGroupObject(headType)),
        showModelGroupObject: () => dispatch(editorActions.showModelGroupObject(headType)),
        togglePage: (page) => dispatch(editorActions.togglePage(headType, page)),
        commitGenerateGcode: (thumbnail) => dispatch(editorActions.commitGenerateGcode(headType, thumbnail)),
        renderGcodeFile: (fileName) => dispatch(workspaceActions.renderGcodeFile(fileName)),
        createToolPath: () => dispatch(editorActions.createToolPath(headType)),
        exportFile: (targetFile) => dispatch(projectActions.exportFile(targetFile)),
        commitGenerateViewPath: () => dispatch(editorActions.commitGenerateViewPath(headType))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Output));
