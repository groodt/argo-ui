import * as classNames from 'classnames';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

export interface DropDownProps {
    isMenu?: boolean;
    anchor: React.ComponentType;
    children: React.ReactNode | (() => React.ReactNode);
}

export interface DropDownState {
    opened: boolean;
    left: number;
    top: number;
}

require('./dropdown.scss');

const dropDownOpened = new BehaviorSubject<DropDown>(null);

export class DropDown extends React.Component<DropDownProps, DropDownState> {
    private el: HTMLDivElement;
    private content: HTMLDivElement;
    private subscription: Subscription;

    constructor(props: DropDownProps) {
        super(props);
        this.state = { opened: false, left: 0, top: 0};
    }

    public render() {
        let children: React.ReactNode = null;
        if (typeof this.props.children === 'function') {
            if (this.state.opened) {
                const fun = this.props.children as () => React.ReactNode;
                children = fun();
            }
        } else {
            children = this.props.children as React.ReactNode;
        }

        return (
            <div className='argo-dropdown' ref={(el) => this.el = el}>
                <div className='argo-dropdown__anchor' onClick={(event) => { this.open(); event.stopPropagation(); }}>
                    <this.props.anchor/>
                </div>
                {ReactDOM.createPortal((
                    <div className={classNames('argo-dropdown__content', { 'opened': this.state.opened, 'is-menu': this.props.isMenu })}
                        style={{top: this.state.top, left: this.state.left}}
                        ref={(el) => this.content = el}>
                        {children}
                    </div>
                ), document.body)}
            </div>
        );
    }

    public componentWillMount() {
        this.subscription = Observable.merge(
            dropDownOpened.filter((dropdown) => dropdown !== this),
            Observable.fromEvent(document, 'click').filter((event: Event) => {
                return this.content && this.state.opened && !this.content.contains(event.target as Node) && !this.el.contains(event.target as Node);
            }),
        ).subscribe(() => {
            this.close();
        });
    }

    public componentWillUnmount() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }

    public close() {
        this.setState({ opened: false });
    }

    private open() {

        if (!this.content || !this.el) {
            return;
        }

        const anchor = this.el.querySelector('.argo-dropdown__anchor') as HTMLElement;
        const {top, left} = anchor.getBoundingClientRect();
        const anchorHeight = anchor.offsetHeight + 2;

        const newState = { left: this.state.left, top: this.state.top, opened: this.state.opened };
        // Set top position
        if (this.content.offsetHeight + top + anchorHeight > window.innerHeight) {
            newState.top = top - this.content.offsetHeight - 2;
        } else {
            newState.top = top + anchorHeight;
        }

        // Set left position
        if (this.content.offsetWidth + left > window.innerWidth) {
            newState.left = left - this.content.offsetWidth + anchor.offsetWidth;
        } else {
            newState.left = left;
        }

        newState.opened = true;
        this.setState(newState);
        dropDownOpened.next(this);
    }
}
