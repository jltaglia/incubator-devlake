import React, { Fragment, useEffect, useState, useRef, useCallback } from 'react'
import { CSSTransition } from 'react-transition-group'
import { useHistory, useParams, Link } from 'react-router-dom'
import { GRAFANA_URL } from '@/utils/config'
import dayjs from '@/utils/time'
import {
  Button, Icon, Intent,
  Card, Elevation,
  Popover,
  Tooltip,
  Position,
  Spinner,
  Colors,
  Classes,
  // Drawer,
  // DrawerSize,
  Menu,
  MenuItem,
  ButtonGroup, InputGroup, Input, Tag, H2, TextArea
} from '@blueprintjs/core'
import { integrationsData } from '@/data/integrations'
import {
  Providers,
  ProviderLabels
} from '@/data/Providers'
import usePipelineManager from '@/hooks/usePipelineManager'
import Nav from '@/components/Nav'
import Sidebar from '@/components/Sidebar'
import AppCrumbs from '@/components/Breadcrumbs'
import Content from '@/components/Content'
import ContentLoader from '@/components/loaders/ContentLoader'
import PipelineIndicator from '@/components/widgets/PipelineIndicator'
import CodeInspector from '@/components/pipelines/CodeInspector'
// import { ReactComponent as GitlabProviderIcon } from '@/images/integrations/gitlab.svg'
// import { ReactComponent as JenkinsProviderIcon } from '@/images/integrations/jenkins.svg'
// import { ReactComponent as JiraProviderIcon } from '@/images/integrations/jira.svg'
// import { ReactComponent as GitHubProviderIcon } from '@/images/integrations/github.svg'
// import { ReactComponent as BackArrowIcon } from '@/images/undo.svg'
import { ReactComponent as HelpIcon } from '@/images/help.svg'
import ManagePipelinesIcon from '@/images/synchronise.png'

const Pipelines = (props) => {
  const history = useHistory()
  const { providerId } = useParams()
  const [activeProvider, setActiveProvider] = useState(integrationsData[0])

  const [isProcessing, setIsProcessing] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const [activeStatus, setActiveStatus] = useState('all')
  const [latestPipeline, setLatestPipeline] = useState()
  const [showInspector, setShowInspector] = useState(false)
  const [inspectPipeline, setInspectPipeline] = useState(null)

  const {
    runPipeline,
    cancelPipeline,
    fetchPipeline,
    pipelines,
    pipelineCount,
    fetchAllPipelines,
    activePipeline,
    pipelineRun,
    isFetching,
    isFetchingAll,
    errors: pipelineErrors,
    setSettings: setPipelineSettings,
    lastRunId,
  } = usePipelineManager()

  const [filteredPipelines, setFilteredPipelines] = useState([])
  const [pagedPipelines, setPagedPipelines] = useState([])
  const [pageOptions, setPageOptions] = useState([
    10,
    25,
    50,
    75,
    100
  ])
  const currentPage = useRef(1)
  const [perPage, setPerPage] = useState(pageOptions[0])
  const [maxPage, setMaxPage] = useState(Math.floor(pipelines.length / perPage))
  // @todo: generate dynamically from $pageOptions
  const pagingOptionsMenu = (
    <Menu>
      <MenuItem active={perPage === 10} icon='key-option' text='10 Records' onClick={() => setPerPage(10)} />
      <MenuItem active={perPage === 25} icon='key-option' text='25 Records' onClick={() => setPerPage(25)} />
      <MenuItem active={perPage === 50} icon='key-option' text='50 Records' onClick={() => setPerPage(50)} />
      <MenuItem active={perPage === 75} icon='key-option' text='75 Records' onClick={() => setPerPage(75)} />
      <MenuItem active={perPage === 100} icon='key-option' text='100 Records' onClick={() => setPerPage(100)} />
    </Menu>
  )
  const nextPage = () => {
    // setCurrentPage(cP => Math.min(maxPage, cP++))
    currentPage.current = Math.min(maxPage, currentPage.current + 1)
    setRefresh(r => !r)
    console.log('>>>> NEXT PAGE', currentPage.current)
  }

  const prevPage = () => {
    // setCurrentPage(cP => Math.min(0, cP--))
    currentPage.current = Math.max(1, currentPage.current - 1)
    setRefresh(r => !r)
    console.log('>>>> PREV PAGE', currentPage.current)
  }

  const resetPage = () => {
    currentPage.current = 1
  }

  const filterPipelines = useCallback((status) => {
    console.log('>>> GOT PIPELINE COUNT = ', pipelines.length, pipelines.length / perPage)
    resetPage()
    setFilteredPipelines(status === 'all' ? pipelines : pipelines.filter((p) => p.status === status))
    // setMaxPage(pipelines.length <= perPage ? 1 : Math.floor(pipelines.length / perPage))
    setTimeout(() => {
      setIsProcessing(false)
    }, 300)
  }, [pipelines, perPage])

  const getPipelineCountByStatus = useCallback((status) => {
    return status === 'all' ? pipelines.length : pipelines.filter((p) => p.status === status).length
  }, [pipelines])

  useEffect(() => {
    fetchAllPipelines()
    return () => {
      currentPage.current = 1
    }
  }, [fetchAllPipelines])

  useEffect(() => {
    console.log('>>> Pipelines', filteredPipelines)
    console.log('>> CURRENT PAGE = ', currentPage.current)
    console.log('>> MAX PAGE = ', maxPage)
    // setFilteredPipelines(pipelines)
    // setPagedPipelines(filteredPipelines.slice(currentPage.current === 1
    //   ? 0
    //   : currentPage.current * perPage, currentPage.current === 1 ? perPage : (currentPage.current * perPage) + perPage))
    if (pipelines.length > 0) {
      const latestPipelineRun = pipelines[0]
      fetchPipeline(latestPipelineRun.ID)
    }
  }, [pipelines, filteredPipelines, fetchPipeline, currentPage, maxPage, perPage])

  useEffect(() => {

  }, [pipelineCount])

  useEffect(() => {
    console.log('>> FILTER STATUS CHANGED ===> ', activeStatus)
    setIsProcessing(true)
    filterPipelines(activeStatus)
  }, [activeStatus, filterPipelines])

  useEffect(() => {
    setPagedPipelines(filteredPipelines.slice(currentPage.current === 1
      ? 0
      : currentPage.current * perPage, currentPage.current === 1 ? perPage : (currentPage.current * perPage) + perPage))
  }, [refresh, perPage, filteredPipelines])

  useEffect(() => {
    console.log('>>> LATEST PIPELINE!', latestPipeline)
  }, [latestPipeline])

  useEffect(() => {
    console.log('>>> FILTERED PIPELINES!', filteredPipelines)
    setMaxPage(filteredPipelines.length <= perPage ? 1 : Math.floor(filteredPipelines.length / perPage))
    setPagedPipelines(filteredPipelines.slice(currentPage.current === 1
      ? 0
      : currentPage.current * perPage, currentPage.current === 1 ? perPage : (currentPage.current * perPage) + perPage))
  }, [filteredPipelines, perPage])

  return (
    <>
      <div className='container'>
        <Nav />
        <Sidebar />
        <Content>
          <main className='main'>
            <AppCrumbs
              items={[
                { href: '/', icon: false, text: 'Dashboard' },
                { href: '/pipelines', icon: false, text: 'Pipelines' },
                { href: '/pipelines', icon: false, text: 'Manage Pipeline Runs', current: true },
              ]}
            />
            <div className='headlineContainer'>
              {/* <Link style={{ float: 'right', marginLeft: '10px', color: '#777777' }} to='/integrations'>
                <Icon icon='fast-backward' size={16} /> Go Back
              </Link> */}
              <div style={{ display: 'flex' }}>
                <div>
                  <span style={{ marginRight: '10px' }}>
                    <Icon icon={<img src={ManagePipelinesIcon} width='38' height='38' />} size={38} />
                  </span>
                </div>
                <div>
                  <h1 style={{ margin: 0 }}>
                    Pipeline Run Logs
                    <Popover
                      className='trigger-manage-pipelines-help'
                      popoverClassName='popover-help-manage-pipelines'
                      position={Position.RIGHT}
                      autoFocus={false}
                      enforceFocus={false}
                      usePortal={false}
                    >
                      <a href='#' rel='noreferrer'><HelpIcon width={19} height={19} style={{ marginLeft: '10px' }} /></a>
                      <>
                        <div style={{ textShadow: 'none', fontSize: '12px', padding: '12px', maxWidth: '300px' }}>
                          <div style={{ marginBottom: '10px', fontWeight: 700, fontSize: '14px', fontFamily: '"Montserrat", sans-serif' }}>
                            <Icon icon='help' size={16} /> Manage Pipeline Runs
                          </div>
                          <p>Need Help? &mdash; Manage, Stop running and Restart failed pipelines.
                            Access <strong>Task Progress</strong> and Activity for all your pipelines.
                          </p>
                        </div>
                      </>
                    </Popover>
                  </h1>
                  <p className='page-description mb-0'>Manage Job Activity for all your pipeline runs.</p>
                  <p className=''>The most recent runs are show first, please select a time range.</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <Button icon='add' intent={Intent.PRIMARY} text='Create Run' onClick={() => history.push('/pipelines/create')} />
                </div>
              </div>
            </div>

            {(isFetchingAll || !isFetchingAll) && (
              <>
                <div style={{ display: 'flex', marginTop: '30px', minHeight: '36px', width: '100%', justifyContent: 'space-between' }}>

                  <ButtonGroup
                    disabled={isFetchingAll || isProcessing}
                    className='filter-status-group'
                    round='true'
                    style={{ fontSize: '12px', zIndex: 0 }}
                  >
                    <Button
                      className='btn-pipeline-filter'
                      intent={activeStatus === 'all' ? 'primary' : null} onClick={() => setActiveStatus('all')}
                    >
                      <span style={{ marginRight: '10x', letterSpacing: '0', fontWeight: 900 }}>All&nbsp;</span>
                      <Tag className='tag-data-count'>{getPipelineCountByStatus('all')}</Tag>
                    </Button>
                    <Button
                      className='btn-pipeline-filter'
                      intent={activeStatus === 'TASK_RUNNING' ? 'primary' : null} onClick={() => setActiveStatus('TASK_RUNNING')}
                    >
                      <span style={{ marginRight: '10x', letterSpacing: '0', fontWeight: 700 }}>Running&nbsp;</span>
                      <Tag className='tag-data-count'>{getPipelineCountByStatus('TASK_RUNNING')}</Tag>
                    </Button>
                    <Button
                      className='btn-pipeline-filter'
                      intent={activeStatus === 'TASK_COMPLETED' ? 'primary' : null} onClick={() => setActiveStatus('TASK_COMPLETED')}
                    >
                      <span style={{ marginRight: '10x', letterSpacing: '0', fontWeight: 700 }}>Complete&nbsp;</span>
                      <Tag className='tag-data-count'>{getPipelineCountByStatus('TASK_COMPLETED')}</Tag>
                    </Button>
                    <Button
                      className='btn-pipeline-filter'
                      intent={activeStatus === 'TASK_FAILED' ? 'primary' : null} onClick={() => setActiveStatus('TASK_FAILED')}
                    >
                      <span style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: '10x',
                        letterSpacing: '0',
                        fontWeight: 700
                      }}
                      >
                        <Icon icon='warning-sign' size={14} style={{ justifySelf: 'center', marginRight: '10px' }} />
                        Failed&nbsp;
                        <Tag className='tag-data-count'>{getPipelineCountByStatus('TASK_FAILED')}</Tag>

                      </span>
                    </Button>
                  </ButtonGroup>
                  {isProcessing && (
                    <Button minimal style={{ marginRight: 'auto' }}>
                      <Spinner size={18} />
                    </Button>
                  )}
                  <InputGroup
                    leftElement={<Icon icon='search' />}
                    placeholder='Search Pipelines'
                    rightElement={<Button text='GO' intent='primary' />}
                    round
                  />
                </div>

                <div style={{ display: 'flex', width: '100%', justifySelf: 'flex-start', marginTop: '8px' }}>
                  <Card interactive={false} elevation={Elevation.TWO} style={{ width: '100%', padding: '2px' }}>
                    <table className='bp3-html-table bp3-html-table-bordered connections-table' style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th><Icon icon='sort-desc' color='#aaa' size={10} style={{ marginRight: '3px', marginBottom: '3px' }} /> ID</th>
                          <th>Pipeline Name</th>
                          <th>Duration</th>
                          <th>Status</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {!isFetchingAll && pagedPipelines.length > 0 && pagedPipelines.map((pipeline, pIdx) => (
                          <tr
                            key={`pipeline-row-${pIdx}`}
                            className={pipeline?.status === 'TASK_FAILED' ? 'pipeline-row pipeline-failed' : 'pipeline-row'}
                            style={{ verticalAlign: 'middle' }}
                          >
                            <td
                              style={{ cursor: 'pointer' }}
                              className='cell-id'
                            >
                              <Tooltip content='Pipeline Run ID' position={Position.TOP}>
                                <a href='#' onClick={() => history.push(`/pipelines/activity/${pipeline.ID}`)}>
                                  {pipeline.ID}
                                </a>
                              </Tooltip>
                            </td>

                            <td
                              onClick={(e) => history.push(`/pipelines/activity/${pipeline.ID}`)}
                              style={{ cursor: 'pointer' }}
                              className='cell-name'
                            >
                              {/* <Icon icon='power' color={Colors.GRAY4} size={10} style={{ float: 'right', marginLeft: '10px' }} /> */}

                              <span style={{
                                display: 'inline-block',
                                float: 'right',
                                color: '#999999',
                                marginLeft: '15px'
                              }}
                              >{dayjs(pipeline.createdAt).format()}
                              </span>

                              <strong style={{
                                lineHeight: '100%',
                                fontSize: '12px',
                                fontWeight: 800,
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                display: 'block',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%'
                              }}
                              >

                                {pipeline.name}
                                {pipeline.status === 'TASK_COMPLETED' && (<Icon
                                  icon='tick' size={10} color={Colors.GREEN5}
                                  style={{ margin: '0 10px', float: 'right', marginBottom: '2px' }}
                                                                          />)}
                              </strong>

                            </td>
                            <td
                              className='cell-duration'
                              style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >

                              {/* {dayjs(pipeline.CreatedAt).toNow(pipeline.CreatedAt)} */}
                              {dayjs(pipeline.UpdatedAt).from(pipeline.CreatedAt, true)}
                            </td>
                            <td className='cell-status' style={{ textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                              <span style={{ display: 'inline-block', float: 'left', marginRight: '10px' }}>
                                <Tooltip content={`Progress ${pipeline.finishedTasks}/${pipeline.totalTasks} Tasks`}>
                                  {pipeline.status === 'TASK_RUNNING' &&
                                  (
                                    <Spinner
                                      style={{ margin: 0 }}
                                      className='mini-task-spinner' size={14} intent='warning'
                                      value={Number(pipeline.finishedTasks / pipeline.totalTasks).toFixed(1)}
                                    />
                                  )}
                                </Tooltip>
                                {pipeline.status === 'TASK_COMPLETED' &&
                                 (
                                   <Tooltip
                                     intent={Intent.SUCCESS}
                                     content={`Finished ${pipeline.finishedTasks}/${pipeline.totalTasks} Tasks`}
                                   >
                                     <Spinner
                                       style={{ margin: 0 }}
                                       className='mini-task-spinner' size={14} intent='success' value={1}
                                     />
                                   </Tooltip>
                                 )}
                                {pipeline.status === 'TASK_FAILED' &&
                                 (
                                   <Tooltip
                                     intent={Intent.PRIMARY}
                                     content={`Failed ${pipeline.finishedTasks}/${pipeline.totalTasks} Tasks`}
                                   >
                                     <Spinner
                                       style={{ margin: 0 }} className='mini-task-spinner'
                                       size={14} intent='info' value={Number(pipeline.finishedTasks / pipeline.totalTasks).toFixed(1)}
                                     />
                                   </Tooltip>
                                 )}
                              </span>
                              {pipeline.status === 'TASK_FAILED' && (
                                <strong style={{ color: Colors.RED5 }}>Failed</strong>
                              )}
                              {pipeline.status === 'TASK_COMPLETED' && (
                                <strong style={{ color: Colors.GREEN5 }}>Complete</strong>
                              )}
                              {pipeline.status === 'TASK_RUNNING' && (
                                <strong style={{ color: Colors.BLUE5 }}>Running</strong>
                              )}
                              {pipeline.status === 'TASK_CREATED' && (
                                <strong style={{ color: Colors.GRAY3 }}>
                                  <Icon icon='time' size={12} color={Colors.GRAY2} style={{ marginBottom: '3px' }} /> Pending...
                                </strong>
                              )}
                            </td>
                            <td className='cell-actions' style={{ padding: '0 10px', verticalAlign: 'middle' }}>
                              <div style={{
                                display: 'flex',
                                justifySelf: 'center',
                                gap: '3px',
                                alignSelf: 'center',
                                alignContent: 'center',
                                alignItems: 'center'
                              }}
                              >
                                <a
                                  href='#'
                                  onClick={() => history.push(`/pipelines/activity/${pipeline.ID}`)}
                                  data-provider={pipeline.id}
                                  className='bp3-button bp3-small bp3-minimal'
                                >
                                  <Icon icon='eye-open' size={16} />
                                </a>
                                {['TASK_FAILED', 'TASK_COMPLETED'].includes(pipeline.status) && (
                                  <a
                                    href='#'
                                    data-provider={pipeline.id}
                                    className='bp3-button bp3-small bp3-minimal'
                                  >
                                    <Icon icon='refresh' size={12} />
                                  </a>)}
                                {pipeline.status === 'TASK_RUNNING' && (

                                  <Popover
                                    key={`popover-help-key-cancel-run-${pipeline.ID}`}
                                    className='trigger-pipeline-cancel'
                                    popoverClassName='popover-pipeline-cancel'
                                    position={Position.BOTTOM}
                                    autoFocus={false}
                                    enforceFocus={false}
                                    usePortal={true}
                                    disabled={pipeline.status !== 'TASK_RUNNING'}
                                  >
                                    <a
                                      href='#'
                                      data-provider={pipeline.id}
                                      className='bp3-button bp3-small bp3-minimal'
                                    >
                                      <Icon icon='stop' size={16} style={{ color: Colors.RED5 }} />
                                    </a>
                                    <>
                                      <div style={{ fontSize: '12px', padding: '12px', maxWidth: '200px' }}>
                                        <p>Are you Sure you want to cancel this <strong>Run</strong>?</p>
                                        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
                                          <Button
                                            text='CANCEL' minimal
                                            small className={Classes.POPOVER_DISMISS}
                                            stlye={{ marginLeft: 'auto', marginRight: '3px' }}
                                          />
                                          <Button
                                            className={Classes.POPOVER_DISMISS}
                                            text='YES' icon='small-tick' intent={Intent.DANGER} small
                                            onClick={() => cancelPipeline(activePipeline.ID)}
                                          />
                                        </div>
                                      </div>
                                    </>
                                  </Popover>

                                )}
                                <a
                                  href='#'
                                  onClick={() => setInspectPipeline(pipeline) | setShowInspector(true)}
                                  data-provider={pipeline.id}
                                  className='bp3-button bp3-small bp3-minimal'
                                >
                                  <Icon icon='code' size={16} />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {isFetchingAll && (
                          <tr>
                            <td className='loading-cell' colSpan='5' style={{ backgroundColor: '#f8f8f8' }}>
                              <ContentLoader
                                elevation={Elevation.ZERO}
                                cardStyle={{ border: '0 !important', boxShadow: 'none', backgroundColor: 'transparent' }}
                                title='Loading Pipeline Runs ...' message='Please wait while the pipeline run logs are loaded.'
                              />
                            </td>
                          </tr>
                        )}

                        {!isFetchingAll && filteredPipelines.length === 0 && (
                          <tr>
                            <td className='no-data-message-cell' colSpan='5' style={{ backgroundColor: '#fffcf0' }}>
                              <h3 style={{
                                fontWeight: 800,
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                margin: 0,
                                fontFamily: '"Montserrat", sans-serif'
                              }}
                              >0 Pipeline Runs
                              </h3>
                              <p style={{ margin: 0 }}>There are no pipeline logs for the current status
                                {' '}<strong>{activeStatus}</strong>.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </Card>

                </div>
                <div style={{ marginTop: '10px', display: 'flex', width: '100%', justifySelf: 'flex-start' }}>

                  <div style={{ display: 'flex', width: '50%', fontSize: '11px', color: '#555555' }}>
                    <Icon icon='user' size={14} style={{ marginRight: '8px' }} />
                    <div>
                      <span>by {' '} <strong>Administrator</strong></span><br />
                      <span style={{ color: '#888888' }}>Displaying{' '}
                        {currentPage.current === 0 ? 0 : perPage * currentPage.current} - {' '}
                        {(perPage * currentPage.current) + perPage} of {filteredPipelines.length}
                        {' '}pipeline runlogs from API.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', marginLeft: 'auto', marginRight: '30px' }}>

                    <Button small icon='add' style={{ marginRight: '5px' }} minimal onClick={() => history.push('/pipelines/create')} />
                    <Button
                      icon='refresh'
                      text='Refresh'
                      onClick={() => fetchAllPipelines()}
                      minimal
                      small
                    />
                  </div>
                  <div className='pagination-controls' style={{ display: 'flex' }}>
                    <Popover placement='bottom'>
                      <Button icon='numbered-list' text={`Rows: ${perPage}`} minimal />
                      <>
                        {pagingOptionsMenu}
                      </>
                    </Popover>
                    <Button
                      onClick={prevPage}
                      className='pagination-btn btn-prev-page'
                      icon='step-backward' small text='PREV' style={{ marginLeft: '5px', marginRight: '5px' }}
                      disabled={currentPage.current === 1}
                    />
                    <Button
                      disabled={currentPage.current === maxPage}
                      onClick={nextPage} className='pagination-btn btn-next-page' rightIcon='step-forward' small text='NEXT'
                    />
                  </div>
                </div>
                <div style={{ height: '50px' }} />
              </>
            )}
            {/* <div style={{ marginTop: '100px', display: 'flex', width: '100%', justifyContent: 'flex-start' }}>
              <Button intent='secondary' icon='eye-open' text='VIEW' style={{ backgroundColor: '#eeeeee', color: '#888888' }} />
              <Button intent='primary' icon='doughnut-chart' text='View Graphs' style={{ backgroundColor: '#eeeeee', color: '#888888', marginLeft: '10px' }} />
              <Button intent='primary' icon='add' text='Add Provider' style={{ backgroundColor: '#eeeeee', color: '#888888', marginLeft: '10px' }} />
              <Button intent='success' icon='refresh' text='Running' style={{ backgroundColor: '#eeeeee', color: '#ffffff', marginLeft: '10px' }} />
            </div> */}
          </main>
        </Content>
      </div>
      {!isFetchingAll &&
      activePipeline &&
      (
        <PipelineIndicator
          pipeline={activePipeline}
          graphsUrl={GRAFANA_URL} onFetch={fetchPipeline} onCancel={cancelPipeline}
        />)}
      {!isFetchingAll &&
      inspectPipeline &&
      (
        <CodeInspector
          isOpen={showInspector}
          activePipeline={inspectPipeline} onClose={setShowInspector}
        />)}

    </>
  )
}

export default Pipelines
