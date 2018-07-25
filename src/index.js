import React, { Fragment, PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames/bind';
import Swipeable from 'react-swipeable';

import style from './style';

const cx = classnames.bind(style);

class Carousel extends PureComponent {

    static displayName = '[component] carousel';

    static propTypes = {
        content: PropTypes.arrayOf(
            PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.element
            ])
        ).isRequired,
        headerName  : PropTypes.string,
        slideHeight : PropTypes.string,
        slideWidth  : PropTypes.string,
        slidesToShow: PropTypes.number,
        speed       : PropTypes.number,
        classNames  : PropTypes.shape({
            header      : PropTypes.string,
            slider      : PropTypes.string,
            arrowWrapper: PropTypes.string
        }),
        indent       : PropTypes.string,
        hasPagination: PropTypes.bool,
        hasHoverStyle: PropTypes.bool
    };

    static defaultProps = {
        speed     : 300,
        classNames: {},
        indent    : '10px'
    };

    constructor() {
        super(...arguments);

        this.$carouselNode = React.createRef();
        this.$wrapperNode = React.createRef();
        this.contentLength = this.props.content.length;
        this.maxTranslate = null;
        this.slidesIsImages = this.props.content.every((src) => typeof src === 'string')
    }

    state = {
        transitionWidth         : null,
        carouselWidth           : null, // eslint-disable-line react/no-unused-state
        sliderDisabled          : false,
        currentTranslate        : 0,
        stepTranslate           : 0
    };

    setFixedSliderParams = (carouselWidth) => {
        const transitionWidth = carouselWidth / this.props.slidesToShow;
        let currentTranslate = transitionWidth * this.state.stepTranslate;

        this.maxTranslate = transitionWidth * this.contentLength - carouselWidth;

        return {
            carouselWidth,
            transitionWidth,
            currentTranslate
        };
    };

    setVariableSliderParams = (carouselWidth) => {
        const newState = {};
        let slideContainerlWidth = this.$wrapperNode.current && this.$wrapperNode.current.getBoundingClientRect().width;
        let transitionWidth = slideContainerlWidth / this.contentLength;
        const visibleSliderPart = slideContainerlWidth - this.state.currentTranslate;

        newState.transitionWidth = transitionWidth;
        newState.slideContainerlWidth = slideContainerlWidth;
        newState.carouselWidth = carouselWidth;
        this.maxTranslate = slideContainerlWidth - carouselWidth;

        if(carouselWidth > slideContainerlWidth) {
            newState.sliderDisabled = true;
        } else {
            this.state.sliderDisabled && (newState.sliderDisabled = false);
        }

        if(visibleSliderPart < carouselWidth && !newState.sliderDisabled) {
            newState.currentTranslate = this.state.currentTranslate - (carouselWidth - visibleSliderPart);
        }

        return newState;
    };

    setSliderParams = () => {
        setTimeout(() => { // костыль для исправления неправильного вычисления ширины общего контейнера при загрузке с сервера из-за поздней загрузки css
            let newState;
            const carouselWidth = this.$carouselNode.current && this.$carouselNode.current.getBoundingClientRect().width;

            if(this.props.slidesToShow) {
                newState = this.setFixedSliderParams(carouselWidth);
            } else {
                newState = this.setVariableSliderParams(carouselWidth);
            }
            this.setState(newState)
        });
    };

    onClickSwitchSlide = (direction) => {
        return () => {
            const newState = {};

            if(direction === 'next') {
                if(this.state.currentTranslate < this.maxTranslate) {
                    newState.stepTranslate = this.state.stepTranslate + 1;

                    newState.currentTranslate = this.state.currentTranslate + this.state.transitionWidth;

                    if(newState.currentTranslate > this.maxTranslate) {
                        newState.currentTranslate = this.maxTranslate;
                    }
                }
            } else {
                if(this.state.currentTranslate > 0) {
                    newState.stepTranslate = this.state.stepTranslate - 1;
                    newState.currentTranslate = this.state.currentTranslate - this.state.transitionWidth;

                    if(newState.currentTranslate < 0) {
                        newState.currentTranslate = 0;
                    }
                }
            }

            if('currentTranslate' in newState) {
                this.setState(newState)
            }
        }
    };

    onClickSwitchPagination = (e) => {
        const index = +e.target.dataset.index;
        let translate = this.state.transitionWidth * index;

        if(translate > this.maxTranslate) {
            translate = this.maxTranslate;
        }

        this.setState({
            stepTranslate   : index,
            currentTranslate: translate
        })
    };

    get elHeader() {
        if(this.props.headerName) {
            const classNames = cx('carousel__header', this.props.classNames.header);

            return <span className={classNames} children={this.props.headerName} />
        }
    }

    elButton(direction) {
        if(!this.state.sliderDisabled) {
            let arrowDisabled = false;
            const rightArrowDisabledRule = this.state.currentTranslate >= this.maxTranslate;

            if(direction === 'prev' && this.state.currentTranslate === 0) {
                arrowDisabled = true;
            } else if(direction === 'next' && rightArrowDisabledRule) {
                arrowDisabled = true;
            }

            if(!arrowDisabled) {
                const classNames = cx(
                    'carousel__arrow',
                    `carousel__arrow_${direction}`
                );

                return (
                    <span className={classNames} onClick={this.onClickSwitchSlide(direction)}>
                        >
                    </span>
                )
            }
        }
    }

    get elControls() {
        return (
            <div className={cx('carousel__arrow-wrapper', this.props.classNames.arrowWrapper)}>
                {this.elButton('prev')}
                {this.elButton('next')}
            </div>
        )
    }

    elSlide(slide) {
        const outerSlideProps = {
            className: cx('carousel__slide', { 'carousel__slide_hover-styled': this.props.hasHoverStyle }),
            style    : {}
        };

        if(this.props.slideWidth) {
            outerSlideProps.style.width = this.props.slideWidth;
        } else if(this.props.slidesToShow) {
            const slideWidth = this.state.transitionWidth - parseInt(this.props.indent, 10);

            outerSlideProps.style.width = `${slideWidth}px`;
        }

        if(this.props.slideHeight) {
            outerSlideProps.style.height = this.props.slideHeight;
        }

        if(this.slidesIsImages) {
            const innerSlideProps = {
                style    : {},
                className: cx('carousel__slide-img'),
                src      : slide
            };

            return (
                <picture {...outerSlideProps}>
                    <img {...innerSlideProps} />
                </picture>
            )
        } else if(React.isValidElement(slide)) {
            return <div {...outerSlideProps}>{slide}</div>
        }
    }

    get elSlides() {
        return this.props.content.map((slide, index) => {
            const animationProps = {
                className     : cx('carousel__slide-wrapper'),
                style         : {},
                ['data-index']: index
            };

            if(index !== this.contentLength - 1) {
                animationProps.style.marginRight = this.props.indent
            }

            return (
                <div key={index} {...animationProps} >
                    {this.elSlide(slide, index)}
                </div>
            )
        })
    }

    get elPagination() {
        if(this.props.hasPagination && this.contentLength) {
            const pagination = [...Array(this.contentLength)];

            return (
                <div className={cx('carousel__pagination')}>
                    {pagination.map((item, index) => {
                        const props = {
                            className: cx(
                                'carousel__pagination-item',
                                { 'carousel__pagination-item_active': this.state.stepTranslate === index }
                            ),
                            'data-index': index,
                            onClick     : this.onClickSwitchPagination
                        };

                        return <span key={index} {...props} />
                    })}
                </div>
            )
        }
    }

    componentDidMount() {
        this.setSliderParams();
        window.addEventListener('resize', this.setSliderParams);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.setSliderParams);
    }

    render() {
        if(this.props.content.length) {
            const sliderProps = {
                className: cx(
                    'carousel',
                    this.props.classNames.slider
                ),
                ref: this.$carouselNode
            };
            const swipeProps = {
                onSwipedRight: this.onClickSwitchSlide('prev'),
                onSwipedLeft : this.onClickSwitchSlide('next'),
                trackMouse   : true
            };
            const slidesWrapperProps = {
                style: {
                    transitionDuration: `${this.props.speed}ms`,
                    transform         : `translateX(-${this.state.currentTranslate}px)`
                },
                className: cx('carousel__wrapper'),
                ref      : this.$wrapperNode
            };

            return (
                <Fragment>
                    {this.elHeader}
                    <Swipeable {...swipeProps}>
                        <div {...sliderProps}>
                            {this.elControls}
                            <div {...slidesWrapperProps}>
                                {this.elSlides}
                            </div>
                        </div>
                    </Swipeable>
                    {this.elPagination}
                </Fragment>
            )
        } else {
            return null;
        }
    }

}

export default Carousel;
